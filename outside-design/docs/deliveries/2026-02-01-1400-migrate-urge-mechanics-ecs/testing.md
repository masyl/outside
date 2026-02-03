# Testing Report: Migrate urge mechanics to ECS

## Automated tests

- **outside-simulator**: Unit tests for urge system (Wait, Wander, Follow, WanderPersistence), API (spawnBot with urge/followTargetEid), and determinism (same seed + tic count ⇒ same state/events).
- **Run**: `pnpm --filter @outside/simulator test` (12 tests).
- **Coverage** (simulator, v8): Statements ~93%, Branches ~75%, Functions ~96%, Lines ~94%. Uncovered: urge fallback (target missing), prefab branch, serialization/state (not used in this delivery).

## Manual testing

- Storybook: Default (scatter + 1-in-5 leaders), FewEntities, ManyEntities, AllWander, FollowChain. Verified follow lines (blue), velocity arrows (orange), smooth Wander (no jitter), tic speed independence (changing tics/sec does not change visual speed).

## Not tested

- No automated tests for Storybook renderer or useSimulatorWorld tick loop.
- Serialization/state modules in simulator are 0% covered (out of scope).

## Recommendations

- Add an integration test that runs a small world for N tics and asserts approximate positions if desired.
- Consider E2E or Storybook test for “follow lines visible when followers exist.”
