// Orbit Harvest — keyboard and pointer input. Exposes the axes and the
// pointer target the world consumes each step, plus one-shot key events
// (pause, mute, restart, start) for the shell in main.js.

import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

export function createInput(canvas) {
  const keys = {};
  let pointer = null;
  const pressed = new Set();

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!e.repeat) pressed.add(k === ' ' ? 'space' : k);
  });
  document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * VIEW_WIDTH / rect.width, y: (cy - rect.top) * VIEW_HEIGHT / rect.height };
  }
  canvas.addEventListener('mousemove', (e) => { pointer = canvasPos(e); });
  canvas.addEventListener('touchstart', (e) => { pointer = canvasPos(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { pointer = canvasPos(e); e.preventDefault(); }, { passive: false });

  return {
    // The movement input for one simulation step.
    axes() {
      return {
        ax: (keys['a'] || keys['arrowleft'] ? -1 : 0) + (keys['d'] || keys['arrowright'] ? 1 : 0),
        ay: (keys['w'] || keys['arrowup'] ? -1 : 0) + (keys['s'] || keys['arrowdown'] ? 1 : 0),
        pointer,
      };
    },
    // True once per physical press of the named key ('p', 'm', 'r', 'space', 'enter').
    wasPressed(name) {
      if (!pressed.has(name)) return false;
      pressed.delete(name);
      return true;
    },
  };
}
