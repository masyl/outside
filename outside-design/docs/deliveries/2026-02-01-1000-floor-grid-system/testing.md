# Testing Report: Floor and Grid System

## Automated tests

- **outside-simulator**: 15 tests across 4 files.
  - **floor.test.ts** (3): Default grids (two grid entities, floorTiles + subPositionSnap resolutions); obstacle collision pushes bot out and bounces when overlapping wall; walkable tile does not revert movement.
  - **api.test.ts** (5): World creation and spawn; run tics and positions update; collision events when entities overlap; drain event queue (uses urge 'none', tilesPerSec 0 for deterministic overlap); configureTicDurationMs.
  - **determinism.test.ts** (2): Same seed and tic count ⇒ identical state; same seed and tic count ⇒ identical event sequence when collisions occur (uses urge 'none' for fixed movement).
  - **urge.test.ts** (5): Wait (speed 0); Wander (direction/speed, persistence); Wander no jitter (6 tics within 10–30 persistence); Follow toward target; Follow stops when close enough.
- **Run**: `pnpm --filter @outside/simulator test`.
- **Coverage**: Simulator is exercised by unit tests; coverage varies. Floor/obstacle collision, grids, urge, collision system, and prefabs are covered. Serialization and observer paths are not a focus of this delivery.

## Manual testing

- **Storybook**: FloorGridRect (rect floor + walls + scattered bots), FloorGridDungeon (dungeon layout + walls + bots in rooms). Verified: grid lines (viewport-clipped), floor tiles (dark grey), walls (light grey), bots bounce off walls and other bots; velocity arrows (shorter, arrowhead); Collided blue fade on entities and wall tiles; no checkpoint revert (smooth movement); 50% speed after collision.

## Not tested

- No automated tests for Storybook FloorTilesLayer, GridOverlay, or SimulatorRenderer.
- No E2E tests for dungeon layout or spawn helpers.
- Collided cooldown decrement and “moving away” skip are covered indirectly via floor and determinism tests.

## Recommendations

- Consider a test that asserts bot–bot obstacle collision (push out, bounce, Collided on both).
- Optional: Storybook interaction test for “wall tiles turn blue when hit.”
- Coverage gate (e.g. 80%) is project-wide; simulator meets it for the code paths used by this delivery.
