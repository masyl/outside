# Delivery Report: Migrate urge mechanics to ECS

## Summary

Wait, wander, and follow urge behaviors were added to outside-simulator; urge-system semantics (close-enough 2 tiles, speed-up beyond 3, max velocity) were matched. Post-delivery: smooth Wander (WanderPersistence), doubled bot speed, tic-synced Storybook loop, and scatter + 1-in-5 leaders demo.

## Included

- **Components**: Wait, Wander, Follow, FollowTarget, FollowTightness, MaxSpeed, WanderPersistence (per-entity persistence for Wander).
- **Urge system**: Wait → speed 0; Wander → direction/speed with 1–3 s persistence; Follow → steer toward target, speed by distance, fallback to Wander if target missing.
- **Pipeline**: urgeSystem → movementSystem → collisionSystem; randomWalkSystem removed.
- **Bot prefab**: Wander + WanderPersistence added per-entity in spawnBot (not on prefab); spawnBot options: urge, followTargetEid, followTightness.
- **Storybook**: Follow lines (blue), velocity arrows (orange); Default/Few/Many use scatter + 1-in-5 leaders; FollowChain (line); AllWander (all Wander); tic accumulator so sim time tracks real time; bot speed 2× (1–4 tps).

## Missing from original plan

- None; plan completed. Post-delivery improvements (smooth Wander, speed, tic sync, scatter+leaders) were added and documented in the plan.

## Extras

- WanderPersistence component and logic so leaders do not jitter every tick.
- Doubled Wander/default speeds (1–4 tps, max 4).
- useSimulatorWorld: run n tics per interval (accumulator) so changing tics/sec does not change simulation speed.
- spawnScatteredWithLeaders (same scatter, 1 in 5 leaders); explicit spawnFn in stories and renderer fallback.

## Test coverage impact

- outside-simulator: 12 tests (urge, api, determinism); coverage ~93% statements, ~75% branches. New tests for Wander persistence (direction/speed stable across tics).

## Next steps

- Pathfinding / obstacle avoidance (from urge-system pitch).
- Expose urge state in debug UI if desired.
- Optional: integration test for multi-tic world state.

## Special mentions

- No new dependencies.
- Removed randomWalk system; bot API is spawnBot-only (no addMovementComponents/addSimEntity/addRandomWalk).
- Storybook default spawn is now spawnScatteredWithLeaders; delivery slug: `2026-02-01-1400-migrate-urge-mechanics-ecs`.
