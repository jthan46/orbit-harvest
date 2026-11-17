// Orbit Harvest — boot and the one loop: input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none in
// a fast one), and the renderer paints what is there. This shell also owns
// the DOM around the canvas: the HUD, the menu / pause / game-over cards,
// and the persistent best score.
//
// ?shot=start|play|end stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.

import { STEP } from './config.js';
import {
  createWorld, startRun, step, togglePause,
  EVENT_CORE, EVENT_GAME_OVER, EVENT_HIT, EVENT_LEVEL_UP, EVENT_MAGNET,
  EVENT_SHIELD, EVENT_SHIELD_BLOCK, EVENT_START,
} from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;

const canvas = document.getElementById('game');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('startScreen');
const overScreen = document.getElementById('overScreen');
const pauseScreen = document.getElementById('pauseScreen');
const muteBtn = document.getElementById('muteBtn');

let best = 0;
try { best = parseInt(localStorage.getItem('orbitHarvestBest') || '0', 10) || 0; } catch (e) { best = 0; }
bestEl.textContent = best;

const world = createWorld(seed);
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

function updateHud() {
  scoreEl.textContent = world.score;
  levelEl.textContent = world.level;
  comboEl.textContent = 'x' + world.combo;
  livesEl.textContent = world.lives > 0 ? '❤'.repeat(world.lives) : '—';
}

function showScreens() {
  startScreen.classList.toggle('hidden', world.state !== 'menu');
  overScreen.classList.toggle('hidden', world.state !== 'over');
  pauseScreen.classList.toggle('hidden', world.state !== 'pause');
}

function fillGameOver() {
  if (world.score > best) {
    best = world.score;
    try { localStorage.setItem('orbitHarvestBest', String(best)); } catch (e) { /* private mode */ }
    bestEl.textContent = best;
  }
  document.getElementById('finalScore').textContent =
    'Score: ' + world.score + '  ·  Level ' + world.level + '  ·  Best: ' + best;
  const notes = [
    'The asteroid field claims another skiff.',
    'A fine harvest, pilot.',
    'The stars will remember this run.',
    'So close to a legendary haul!',
  ];
  document.getElementById('finalNote').textContent =
    world.score >= 500 ? notes[3] : notes[world.score % 3];
}

function playEvents(events) {
  if (events & EVENT_START) audio.beep(520, 0.12, 'triangle', 0.09);
  if (events & EVENT_CORE) audio.beep(620 + world.combo * 60, 0.09, 'sine', 0.08);
  if (events & EVENT_MAGNET) audio.beep(880, 0.16, 'triangle', 0.09);
  if (events & EVENT_SHIELD) audio.beep(760, 0.16, 'triangle', 0.09);
  if (events & EVENT_SHIELD_BLOCK) audio.beep(300, 0.15, 'square', 0.07);
  if (events & EVENT_HIT) audio.beep(110, 0.3, 'sawtooth', 0.09);
  if (events & EVENT_LEVEL_UP) audio.beep(700, 0.14, 'triangle', 0.08);
  if (events & EVENT_GAME_OVER) { fillGameOver(); audio.beep(160, 0.5, 'sawtooth', 0.07); }
}

function doStart() {
  playEvents(startRun(world));
  updateHud();
  showScreens();
}

function doTogglePause() {
  togglePause(world);
  showScreens();
}

function doToggleMute() {
  const muted = audio.toggleMute();
  muteBtn.textContent = muted ? 'Sound: off (M)' : 'Sound: on (M)';
}

document.getElementById('startBtn').addEventListener('click', doStart);
document.getElementById('againBtn').addEventListener('click', doStart);
document.getElementById('resumeBtn').addEventListener('click', doTogglePause);
document.getElementById('pauseBtn').addEventListener('click', doTogglePause);
muteBtn.addEventListener('click', doToggleMute);

function handleKeys() {
  if (input.wasPressed('p')) doTogglePause();
  if (input.wasPressed('m')) doToggleMute();
  if (input.wasPressed('r') && world.state === 'over') doStart();
  if ((input.wasPressed('space') || input.wasPressed('enter')) &&
      (world.state === 'menu' || world.state === 'over')) doStart();
}

function runShot(name) {
  const scene = stageShot(name, world);
  if (scene === 'end') fillGameOver();
  updateHud();
  showScreens();
  renderer.draw(world);
  renderer.draw(world);
  window.__shotReady = true;
}

let last = null;
let accumulator = 0;
function frame(ts) {
  if (last === null) last = ts;
  let dt = (ts - last) / 1000;
  last = ts;
  if (dt > MAX_FRAME) dt = MAX_FRAME;
  accumulator += dt;
  handleKeys();
  let events = 0;
  while (accumulator >= STEP) {
    events |= step(world, input.axes());
    accumulator -= STEP;
  }
  if (events) { playEvents(events); updateHud(); showScreens(); }
  renderer.draw(world);
  requestAnimationFrame(frame);
}

updateHud();
showScreens();
if (shot) runShot(shot);
else requestAnimationFrame(frame);
