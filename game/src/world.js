// Orbit Harvest — the deterministic simulation. One step is 1/60 of a
// second; step() advances the world by exactly one step given the current
// input, and returns a bitmask of events for the sound and HUD layers.
// Nothing here touches the DOM, the clock, or Math.random.

import {
  COMBO_MAX, COMBO_WINDOW_STEPS, CORE_MAX, CORE_RADIUS, CORE_SCORE,
  CORE_TTL_STEPS, INVULN_HIT_STEPS, INVULN_SHIELD_STEPS, LEVEL_STEPS,
  MAGNET_PULL, MAGNET_RANGE, MAGNET_STEPS, PLAYER_ACCEL, PLAYER_DAMPING,
  PLAYER_MAX_SPEED, PLAYER_RADIUS, STAR_COUNT, START_LIVES, VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { createRandom } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_CORE = 1;
export const EVENT_MAGNET = 2;
export const EVENT_SHIELD = 4;
export const EVENT_HIT = 8;
export const EVENT_SHIELD_BLOCK = 16;
export const EVENT_LEVEL_UP = 32;
export const EVENT_GAME_OVER = 64;
export const EVENT_START = 128;

const W = VIEW_WIDTH;
const H = VIEW_HEIGHT;
const TAU = Math.PI * 2;

export function createWorld(seed) {
  const rng = createRandom(seed ?? 1);
  const world = {
    rng,
    state: 'menu', // menu | play | pause | over
    stepCount: 0,
    player: null,
    cores: [], rocks: [], orbs: [], parts: [], stars: [],
    score: 0, lives: START_LIVES, level: 1, combo: 1, comboTimer: 0,
    elapsedSteps: 0, shake: 0, magnetSteps: 0, shieldOn: false,
    spawnCoreIn: 0, spawnRockIn: 0, spawnOrbIn: 0,
  };
  makeStars(world);
  resetRun(world);
  world.state = 'menu';
  return world;
}

function makeStars(world) {
  world.stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    world.stars.push({
      x: world.rng.next() * W, y: world.rng.next() * H,
      r: world.rng.range(0.6, 2.1), s: world.rng.range(8, 42),
      tw: world.rng.range(0, TAU),
    });
  }
}

export function resetRun(world) {
  world.player = {
    x: W / 2, y: H / 2, r: PLAYER_RADIUS, vx: 0, vy: 0,
    invulnSteps: 0, angle: -Math.PI / 2,
  };
  world.cores = []; world.rocks = []; world.orbs = []; world.parts = [];
  world.score = 0; world.lives = START_LIVES; world.level = 1;
  world.combo = 1; world.comboTimer = 0; world.elapsedSteps = 0;
  world.shake = 0; world.magnetSteps = 0; world.shieldOn = false;
  world.spawnCoreIn = 18; world.spawnRockIn = 84; world.spawnOrbIn = 420;
}

export function startRun(world) {
  resetRun(world);
  world.state = 'play';
  return EVENT_START;
}

export function togglePause(world) {
  if (world.state === 'play') world.state = 'pause';
  else if (world.state === 'pause') world.state = 'play';
  return world.state;
}

function burst(world, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = world.rng.next() * TAU;
    const sp = world.rng.range(40, 220);
    world.parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      lifeSteps: Math.round(world.rng.range(18, 48)), tSteps: 0,
      color, r: world.rng.range(1.5, 3.5),
    });
  }
}

function spawnCore(world) {
  world.cores.push({
    x: world.rng.range(30, W - 30), y: world.rng.range(30, H - 30),
    r: CORE_RADIUS, tSteps: 0, ttlSteps: CORE_TTL_STEPS,
    ph: world.rng.range(0, TAU),
  });
}

function spawnRock(world) {
  const edge = world.rng.int(0, 3);
  let x, y;
  if (edge === 0) { x = world.rng.range(0, W); y = -30; }
  else if (edge === 1) { x = W + 30; y = world.rng.range(0, H); }
  else if (edge === 2) { x = world.rng.range(0, W); y = H + 30; }
  else { x = -30; y = world.rng.range(0, H); }
  const ang = Math.atan2(world.player.y - y, world.player.x - x) + world.rng.range(-0.5, 0.5);
  const sp = world.rng.range(60, 110) + world.level * 14;
  const verts = [];
  for (let i = 0; i < 9; i++) verts.push(world.rng.range(0.75, 1.15));
  world.rocks.push({
    x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
    r: world.rng.range(13, 30), rot: world.rng.range(0, TAU),
    vr: world.rng.range(-1.4, 1.4), verts,
  });
}

function spawnOrb(world) {
  world.orbs.push({
    x: world.rng.range(40, W - 40), y: world.rng.range(40, H - 40),
    r: 13, tSteps: 0, ttlSteps: 540,
    kind: world.rng.next() < 0.5 ? 'magnet' : 'shield',
  });
}

function hitPlayer(world) {
  const p = world.player;
  if (p.invulnSteps > 0) return EVENT_NONE;
  if (world.shieldOn) {
    world.shieldOn = false;
    p.invulnSteps = INVULN_SHIELD_STEPS;
    burst(world, p.x, p.y, '#34d399', 18);
    return EVENT_SHIELD_BLOCK;
  }
  world.lives--;
  world.shake = 14;
  p.invulnSteps = INVULN_HIT_STEPS;
  world.combo = 1; world.comboTimer = 0;
  burst(world, p.x, p.y, '#fb7185', 26);
  if (world.lives <= 0) {
    world.state = 'over';
    return EVENT_HIT | EVENT_GAME_OVER;
  }
  return EVENT_HIT;
}

// input: { ax, ay } each -1..1, and pointer: { x, y } or null.
export function step(world, input) {
  let events = EVENT_NONE;
  world.stepCount++;

  // The starfield drifts on every screen.
  for (const st of world.stars) {
    st.y += st.s / 60;
    st.tw += 2 / 60;
    if (st.y > H + 3) { st.y = -3; st.x = world.rng.next() * W; }
  }
  if (world.state !== 'play') return events;

  const p = world.player;
  world.elapsedSteps++;
  const newLevel = 1 + Math.floor(world.elapsedSteps / LEVEL_STEPS);
  if (newLevel !== world.level) {
    world.level = newLevel;
    burst(world, p.x, p.y, '#a78bfa', 22);
    events |= EVENT_LEVEL_UP;
  }

  // Movement: keyboard thrust, pointer steering.
  p.vx += input.ax * PLAYER_ACCEL / 60;
  p.vy += input.ay * PLAYER_ACCEL / 60;
  if (input.pointer) {
    const dx = input.pointer.x - p.x;
    const dy = input.pointer.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 6) {
      p.vx += (dx / dist) * PLAYER_ACCEL * 1.15 / 60;
      p.vy += (dy / dist) * PLAYER_ACCEL * 1.15 / 60;
    }
  }
  const damp = Math.pow(PLAYER_DAMPING, 1 / 60);
  p.vx *= damp; p.vy *= damp;
  const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  if (spd > PLAYER_MAX_SPEED) { p.vx = p.vx / spd * PLAYER_MAX_SPEED; p.vy = p.vy / spd * PLAYER_MAX_SPEED; }
  p.x += p.vx / 60; p.y += p.vy / 60;
  if (p.x < p.r) p.x = p.r;
  if (p.x > W - p.r) p.x = W - p.r;
  if (p.y < p.r) p.y = p.r;
  if (p.y > H - p.r) p.y = H - p.r;
  if (spd > 24) p.angle = Math.atan2(p.vy, p.vx);
  if (p.invulnSteps > 0) p.invulnSteps--;

  if (world.comboTimer > 0) {
    world.comboTimer--;
    if (world.comboTimer <= 0) world.combo = 1;
  }

  // Spawning.
  if (--world.spawnCoreIn <= 0 && world.cores.length < CORE_MAX) {
    spawnCore(world);
    world.spawnCoreIn = Math.round(world.rng.range(30, 66));
  }
  if (--world.spawnRockIn <= 0) {
    spawnRock(world);
    world.spawnRockIn = Math.round(Math.max(21, 75 - world.level * 5.4) * world.rng.range(0.7, 1.2));
  }
  if (--world.spawnOrbIn <= 0) {
    spawnOrb(world);
    world.spawnOrbIn = Math.round(world.rng.range(540, 900));
  }
  if (world.magnetSteps > 0) world.magnetSteps--;

  // Cores.
  for (let i = world.cores.length - 1; i >= 0; i--) {
    const c = world.cores[i];
    c.tSteps++;
    if (world.magnetSteps > 0) {
      const dx = p.x - c.x, dy = p.y - c.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < MAGNET_RANGE) { c.x += dx / d * MAGNET_PULL / 60; c.y += dy / d * MAGNET_PULL / 60; }
    }
    const dx = p.x - c.x, dy = p.y - c.y;
    if (dx * dx + dy * dy < (p.r + c.r) * (p.r + c.r)) {
      world.score += CORE_SCORE * world.combo;
      world.combo = Math.min(COMBO_MAX, world.combo + 1);
      world.comboTimer = COMBO_WINDOW_STEPS;
      burst(world, c.x, c.y, '#fbbf24', 12);
      world.cores.splice(i, 1);
      events |= EVENT_CORE;
      continue;
    }
    if (c.tSteps > c.ttlSteps) world.cores.splice(i, 1);
  }

  // Orbs.
  for (let i = world.orbs.length - 1; i >= 0; i--) {
    const o = world.orbs[i];
    o.tSteps++;
    const dx = p.x - o.x, dy = p.y - o.y;
    if (dx * dx + dy * dy < (p.r + o.r) * (p.r + o.r)) {
      if (o.kind === 'magnet') { world.magnetSteps = MAGNET_STEPS; burst(world, o.x, o.y, '#6ee7ff', 16); events |= EVENT_MAGNET; }
      else { world.shieldOn = true; burst(world, o.x, o.y, '#34d399', 16); events |= EVENT_SHIELD; }
      world.orbs.splice(i, 1);
      continue;
    }
    if (o.tSteps > o.ttlSteps) world.orbs.splice(i, 1);
  }

  // Rocks.
  for (let i = world.rocks.length - 1; i >= 0; i--) {
    const r = world.rocks[i];
    r.x += r.vx / 60; r.y += r.vy / 60; r.rot += r.vr / 60;
    if (r.x < -70 || r.x > W + 70 || r.y < -70 || r.y > H + 70) { world.rocks.splice(i, 1); continue; }
    const dx = p.x - r.x, dy = p.y - r.y, rr = p.r + r.r * 0.82;
    if (dx * dx + dy * dy < rr * rr) {
      events |= hitPlayer(world);
      world.rocks.splice(i, 1);
      if (world.state !== 'play') return events;
    }
  }

  // Particles.
  for (let i = world.parts.length - 1; i >= 0; i--) {
    const pt = world.parts[i];
    pt.tSteps++;
    pt.x += pt.vx / 60; pt.y += pt.vy / 60;
    if (pt.tSteps > pt.lifeSteps) world.parts.splice(i, 1);
  }
  if (world.shake > 0) world.shake = Math.max(0, world.shake - 26 / 60);
  return events;
}
