# Implementation Plan: Migrate urge mechanics to ECS

## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Urge semantics**: [urge-system/pitch.md](../urge-system/pitch.md)

## Overview

Add wait, wander, and follow urge behaviors to outside-simulator (reusing existing movement and randomWalk where applicable), match semantics from the urge-system delivery (close-enough 2 tiles, speed-up beyond 3 tiles, max velocity 2 tps, tightness), and add follow lines plus direction/velocity arrows in the Storybook test renderer. No changes to outside-client. Pipeline becomes: urge → movement → collision (randomWalk removed; Wander branch in urge system implements random walk).

## Scope

- **Simulator + Storybook only** — no changes to outside-client.
- **Reuse movement** — existing movement and randomWalk logic; add urge behaviors on top.
- **Semantics** — match [urge-system delivery](../urge-system/pitch.md).

---

## 1. Components (outside-simulator)

- [x] Add urge-related components under `packages/outside-simulator/src/components/` (one file per component; codegen picks them up):
  - **Wait** — tag: entity does not move this tic.
  - **Wander** — tag: entity uses random direction/speed each tic.
  - **Follow** — tag: entity steers toward a target entity.
  - **FollowTarget** — SoA: `eid: number[]` (target entity id).
  - **FollowTightness** — SoA: `value: number[]` (0 = instant; higher = slower adjustment).
  - **MaxSpeed** — SoA: `tilesPerSec: number[]` (cap for movement; default 2 tps).
- [x] Run codegen: `pnpm --filter @outside/simulator run gen:component-types`.

---

## 2. Urge system (outside-simulator)

- [x] Add [packages/outside-simulator/src/systems/urge.ts](packages/outside-simulator/src/systems/urge.ts):
  - **Wait:** For entities with Wait, set Speed.tilesPerSec[eid] = 0.
  - **Wander:** Same logic as current randomWalk: random angle, speed in [0.5, 2.0] (or MaxSpeed cap).
  - **Follow:** For entities with Follow + FollowTarget: resolve target; if missing, remove Follow/FollowTarget and add Wander. If d < 2 tiles: speed 0, direction toward target. If d ≥ 2: direction toward target (with tightness smoothing), speed f(d) capped at MaxSpeed or 2 tps (speed up when d > 3).
- [x] Constants: close-enough = 2 tiles, speed-up threshold = 3 tiles, max velocity = 2 tps (from urge-system).
- [x] Update [packages/outside-simulator/src/run.ts](packages/outside-simulator/src/run.ts): pipeline = urgeSystem → movementSystem → collisionSystem; remove randomWalkSystem.
- [x] Remove or deprecate [packages/outside-simulator/src/systems/randomWalk.ts](packages/outside-simulator/src/systems/randomWalk.ts) (Wander branch replaces it).

---

## 3. Movement system and MaxSpeed

- [x] In [packages/outside-simulator/src/systems/movement.ts](packages/outside-simulator/src/systems/movement.ts): when computing distance, if entity has MaxSpeed, use min(Speed.tilesPerSec[eid], MaxSpeed.tilesPerSec[eid]).

---

## 4. Bot prefab and spawn API

- [x] Bot prefab: Add Wander (default urge); remove RandomWalk. Optionally add MaxSpeed default 2 tps.
- [x] Extend [packages/outside-simulator/src/prefabs/bot.ts](packages/outside-simulator/src/prefabs/bot.ts) SpawnBotOptions with `urge?: 'wait' | 'wander' | 'follow'`, `followTargetEid?: number`, `followTightness?: number`. When urge === 'follow' and followTargetEid set, add Follow, FollowTarget (and optional FollowTightness). When urge === 'wait', add Wait; when 'wander' or omitted, add Wander.

---

## 5. Storybook test renderer

- [x] **Follow lines:** For each entity with Follow + FollowTarget, draw SVG line from follower to target (same toX/toY as circles). In SimulatorRenderer or viewport; keep SimulatorEntity presentational.
- [x] **Velocity arrow:** For each entity, draw arrow from center in direction of Direction, length scaled by Speed (e.g. line to (cx + k·cos(angle)·speed, cy - k·sin(angle)·speed)).
- [x] Add story variant: 5 bots, first Wander, next four Follow targeting previous in chain (daisy chain); show follow lines and arrows.

---

## 6. Tests (outside-simulator)

- [x] Unit tests for urge system: Wait → speed 0; Wander → direction/speed change; Follow → direction toward target, speed 0 when d < 2, capped when d > 3; target missing → fallback to Wander.
- [x] Determinism: same seed + same spawn (including follow chain) + same tic count ⇒ same positions and events.
- [x] API: spawnBot with urge and followTargetEid; query by Follow.

---

## 7. Constants and docs

- [x] Define urge constants (close-enough, speed-up threshold, max velocity) in urge system or small module; TSDoc and reference urge-system delivery.
- [x] Update package exports if new components are public; keep API minimal.

---

## Pipeline summary

```
urgeSystem (Wait: speed=0; Wander: random dir/speed; Follow: steer) → movementSystem → collisionSystem
```

---

## Out of scope

- No changes to outside-client (host, autonomy, commands).
- No pathfinding/navmesh; no obstacle avoidance beyond existing collision.
- Follow lines and arrows only in Storybook test renderer.

---

## Post-delivery improvements (wrapped up)

- [x] **WanderPersistence**: Keep direction/speed for 1–3 s (no jitter); per-entity Wander + WanderPersistence in spawnBot (prefab no longer has Wander so prefab not in wander query).
- [x] **Double bot speed**: Wander range 1–4 tps, max 4 tps; prefab defaults updated.
- [x] **Tic sync**: Storybook runs n tics per interval so sim time tracks real time (accumulator in useSimulatorWorld).
- [x] **Scatter + 1-in-5 leaders**: spawnScatteredWithLeaders reuses scatter; Default/Few/Many stories use it; AllWander and FollowChain remain separate.
