// Orbit Harvest — constants. The simulation runs at a fixed 60 steps per
// second, so every duration below is in steps and every speed is per step
// or per second as named; the same seed and the same inputs always replay
// the same run.

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;

export const STEP = 1 / 60;

export const PLAYER_RADIUS = 15;
export const PLAYER_ACCEL = 1500; // px per second^2
export const PLAYER_MAX_SPEED = 430; // px per second
export const PLAYER_DAMPING = 0.12; // velocity retained after one second

export const START_LIVES = 3;
export const LEVEL_STEPS = 15 * 60; // a new level every 15 seconds

export const CORE_RADIUS = 11;
export const CORE_MAX = 6;
export const CORE_TTL_STEPS = 7 * 60;
export const CORE_SCORE = 10;
export const COMBO_MAX = 9;
export const COMBO_WINDOW_STEPS = 150; // 2.5 seconds to chain the next core

export const MAGNET_STEPS = 6 * 60;
export const MAGNET_RANGE = 240;
export const MAGNET_PULL = 260; // px per second

export const INVULN_HIT_STEPS = 96; // 1.6 seconds after losing a heart
export const INVULN_SHIELD_STEPS = 72; // 1.2 seconds after a shield block

export const STAR_COUNT = 130;
