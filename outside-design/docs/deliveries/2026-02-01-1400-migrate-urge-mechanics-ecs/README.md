---
Title: Migrate urge mechanics to ECS
DeliveryDate: 2026-02-01
Summary: Wait, wander, follow urge behaviors in outside-simulator; smooth Wander, tic-synced Storybook, scatter + 1-in-5 leaders demo.
Status: Done
Branch: feature/migrate-urge-mechanics-ecs
Commit: f6278b0
---

# Migrate urge mechanics to ECS

Completion: 2026-02-01  
Branch: feature/migrate-urge-mechanics-ecs  
Tag: delivery/2026-02-01-1400-migrate-urge-mechanics-ecs

Urge system (Wait, Wander, Follow) added to outside-simulator with urge-system semantics. Post-delivery: WanderPersistence for smooth walk, doubled bot speed, Storybook tic sync so sim speed is independent of tics/sec, and scatter placement with 1-in-5 leaders.

## Summary

- Urge system: Wait (speed 0), Wander (persisted 1–3 s), Follow (steer toward target, close-enough 2 tiles, speed-up beyond 3).
- Pipeline: urgeSystem → movementSystem → collisionSystem; randomWalkSystem removed.
- Bot prefab: Wander + WanderPersistence per-entity; spawnBot options urge, followTargetEid, followTightness.
- Storybook: follow lines (blue), velocity arrows (orange); Default/Few/Many = scatter + 1-in-5 leaders; FollowChain, AllWander; tic accumulator; 2× speed.

## Documents

- [Pitch](./pitch.md)
- [Plan](./plan.md)
- [Delivery Report](./delivered.md)
- [Testing Report](./testing.md)
- [Commit Preparation](./commit.md)
