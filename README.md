# orbit-harvest

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/jthan46/orbit-harvest/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/jthan46/orbit-harvest/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Orbit Harvest** — an original space-arcade game.

Pilot your skiff through an asteroid field and harvest glowing star cores. Chain cores quickly to raise your combo multiplier up to x9, grab a magnet orb to pull cores toward you, and keep a shield orb between you and the rocks — each asteroid hit costs one of your three hearts, and the field gets faster and denser every level. How long can you last?

## How it plays

- Move: WASD / arrow keys, the mouse, or touch
- P: pause · M: mute · R: restart after game over
- Star cores score 10 x your current combo; the combo resets if you go 2.5 seconds without collecting
- Levels rise every 15 seconds: asteroids spawn faster and fly quicker

The game is the plain static files in `game/` (`game/index.html` and its ES modules): no build step, no library, no network request — it runs fully offline. The simulation is a fixed 60 steps/second timestep driven by a seeded RNG, so the same seed and the same inputs always replay the same run.

## Structure

- `game/src/config.js` — constants: field size, speeds, spawn and combo tuning
- `game/src/random.js` — the seeded RNG the whole simulation draws from
- `game/src/world.js` — the deterministic simulation: ship, cores, orbs, asteroids, combo, levels
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard and pointer input
- `game/src/audio.js` — tiny WebAudio bleeps
- `game/src/shots.js` — the staged screenshot scenes behind `?shot=start|play|end`
- `game/src/main.js` — the frame loop, HUD and screens
- `main.ts` — hands the entry in: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `serve.ts` — a tiny local static server for playing the game

## License

MIT — see `LICENSE`.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=bjydwhj1&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
