# Testing Report: Food in the Dungeon — Static Pickups

## Automated tests

- **outside-simulator**: 16 tests across 4 files.
  - **api.test.ts** (6): World creation and spawn; run tics and positions update; collision events when entities overlap; **consumed event when bot overlaps food** (new); drain event queue; configureTicDurationMs.
  - **floor.test.ts** (3): Default grids; obstacle collision; walkable tile.
  - **determinism.test.ts** (2): Same seed ⇒ identical state; same seed ⇒ identical event sequence.
  - **urge.test.ts** (5): Wait, Wander, Follow, persistence, no jitter.
- **Run**: `pnpm --filter @outside/simulator test`.
- **Coverage**: Consumption system, spawnFood prefab, Food component, ConsumedEvent are exercised. Storybook rendering is not covered by unit tests.

## Manual testing

- **Storybook**: FloorGridDungeonWithFood story. Verified: green food circles appear in dungeon rooms; bots overlap food and food disappears; no regressions in other stories.

## Not tested

- No automated tests for Storybook food rendering or spawnDungeonWithFood.
- ConsumedEvent handling in downstream consumers (e.g. outside-client) not exercised.
- Multiple bots overlapping same food in same tic (one consumes, others don't) — covered by single-bot test; multi-bot case is implicit in consumption logic.

## Recommendations

- Optional: add determinism test that includes food and asserts consumed event sequence for same seed.
- Consider Storybook interaction test for "food disappears when bot overlaps" if visual regression tooling is adopted.
