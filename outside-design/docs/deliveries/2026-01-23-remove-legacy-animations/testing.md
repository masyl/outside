# Testing Report: Remove Legacy Animations / Unified Renderer / Continuous Motion

## Overview

This report captures automated and manual testing for the migration work performed in this delivery:

- Unified rendering pipeline (bots + terrain)
- Deterministic continuous bot motion (`SIM_TICK`)
- Camera follow, layering, zoom scaling, sprite facing + walk cycle
- FPS cap + debug overlay performance work (Safari vs Chrome)

## Automated tests (ran locally)

### Commands

```bash
pnpm build
pnpm test
pnpm test:coverage
```

### Results

- **Build**: `pnpm build` ✅ (all packages)
- **Tests**: `pnpm test` ✅
  - `@outside/core`: **46/46** passing tests
  - `@outside/client`: **175/175** passing tests
  - `@outside/design`, `@outside/server`, `@outside/doc`: “No tests yet” (current scripts)
- **Coverage**: `pnpm test:coverage` ✅
  - `@outside/core`:
    - Statements **95.4%**, Branches **92.0%**, Functions **96.0%**, Lines **95.06%**
  - `@outside/client`:
    - Statements **47.99%**, Branches **46.11%**, Functions **54.32%**, Lines **48.71%**

## Manual verification (smoke)

- **Runtime stability**: game boots and runs without crashes/regressions (user verified during iteration).
- **Camera follow**: viewport follows selected bot (regression fixed).
- **Layering**: bots + debug overlay render above terrain (regression fixed).
- **Zoom**: bot visuals scale with global zoom (regression fixed).
- **Motion**:
  - bots move with subtile positions (no integer snapping in render)
  - velocity vector debug line is stable and length encodes speed
  - walk animation continues smoothly (phase continuity via distance accumulator)
- **FPS / browsers**:
  - Chrome/Chromium: stable frame pacing near expected display refresh/cap
  - Safari: debug overlay is now much cheaper (single multiline text + paused sampling when hidden); remaining Safari differences are considered acceptable for this delivery

## Not tested / known gaps

- **Sprite top-row cropping**: still observed intermittently (not addressed in this delivery).
- **8-direction sprite coverage**: not exhaustively verified visually (logic exists via `directionFromVelocity`).
- **Deep multiplayer/network scenarios**: not exercised beyond local smoke testing.

## Appendix: checklist carry-over (historical notes)

### Fixed in this delivery

- [x] The cardinal direction vector is no longer update to reflect the direction the bots is facing after moving.
- [x] The viewport point-of-view is no longer following the currently selected bot.
- [x] The velocity vector has disapeared from the debug layer
- [x] Limit the max FPS to 60 (cap + diagnostics; stable in Chrome, Safari improved)
- [x] When the state of the bot is walking, it should cycle through the walk animation sprites.
- [x] The exact speed of the walk animation should match the speed.
- [x] The transition between ticks should be smoothened (purely visual, not stored in state)

### Remaining / deferred

- [ ] The top pixel line of the bot sprite keeps getting cropped.
- [ ] The bots should show all 8 directions when moving with the new movement system
