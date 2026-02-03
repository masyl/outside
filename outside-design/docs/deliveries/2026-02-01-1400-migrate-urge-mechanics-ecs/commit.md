# Commit preparation: Migrate urge mechanics to ECS

For use when merging the feature branch (e.g. squash and merge).

## Title

feat(simulator): urge mechanics (Wait, Wander, Follow) + smooth Wander, tic sync, scatter+leaders

## Body

- Add urge system: Wait, Wander, Follow; WanderPersistence for 1–3 s smooth walk (no jitter).
- Pipeline: urgeSystem → movementSystem → collisionSystem; remove randomWalkSystem.
- Bot prefab: Wander/WanderPersistence per-entity in spawnBot; options urge, followTargetEid, followTightness.
- Storybook: follow lines (blue), velocity arrows (orange); scatter + 1-in-5 leaders default; tic accumulator so sim speed independent of tics/sec; double bot speed (1–4 tps).
- Tests: urge, API, determinism; Wander persistence assertion.

References: pitch [2026-02-01-1400-migrate-urge-mechanics-ecs](./pitch.md), urge-system delivery semantics.

## Tags

- delivery/2026-02-01-1400-migrate-urge-mechanics-ecs
