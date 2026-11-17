// The screenshot scenes behind ?shot=start|play|end. Each one drives the
// real simulation with a small autopilot (steer at the nearest core), so
// what a screenshot shows is the game itself, played — never a mock-up.

import { startRun, step } from './world.js';

function autopilot(world, steps) {
  for (let i = 0; i < steps; i++) {
    if (world.state !== 'play') break;
    let target = null;
    let bestD = Infinity;
    for (const c of world.cores) {
      const dx = c.x - world.player.x, dy = c.y - world.player.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; target = c; }
    }
    const pointer = target ? { x: target.x, y: target.y } : null;
    step(world, { ax: 0, ay: 0, pointer });
  }
}

function placeRock(world, x, y, vx, vy, r) {
  const verts = [];
  for (let i = 0; i < 9; i++) verts.push(0.85 + (i % 3) * 0.12);
  world.rocks.push({ x, y, vx, vy, r, rot: 0.6, vr: 0.8, verts });
}

export function stageShot(name, world) {
  if (name === 'play') {
    startRun(world);
    autopilot(world, 330);
    if (world.state === 'play') {
      // Make sure the frame reads as mid-action whatever the autopilot met.
      if (world.rocks.length < 2) {
        placeRock(world, 150, 110, 55, 30, 24);
        placeRock(world, 800, 420, -48, -26, 19);
      }
      if (world.orbs.length === 0) {
        world.orbs.push({ x: 700, y: 140, r: 13, tSteps: 0, ttlSteps: 540, kind: 'magnet' });
      }
      if (world.cores.length === 0) {
        world.cores.push({ x: 300, y: 380, r: 11, tSteps: 0, ttlSteps: 420, ph: 1.2 });
      }
      world.magnetSteps = Math.max(world.magnetSteps, 240);
    }
    return 'play';
  }

  if (name === 'end') {
    startRun(world);
    autopilot(world, 420);
    world.score = Math.max(world.score, 240);
    world.level = Math.max(world.level, 3);
    world.lives = 0;
    world.state = 'over';
    return 'end';
  }

  // 'start' (and anything unknown): the menu scene, a few cores drifting
  // in the field behind the title card.
  world.state = 'menu';
  world.cores = [
    { x: 180, y: 130, r: 11, tSteps: 40, ttlSteps: 420, ph: 0.4 },
    { x: 770, y: 110, r: 11, tSteps: 90, ttlSteps: 420, ph: 2.1 },
    { x: 830, y: 400, r: 11, tSteps: 20, ttlSteps: 420, ph: 4.0 },
    { x: 120, y: 420, r: 11, tSteps: 65, ttlSteps: 420, ph: 5.3 },
  ];
  return 'start';
}
