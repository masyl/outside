# Implementation Plan: Replace Collision with 3D Physics Engine

## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Global pitch**: ../../pitches/replace-collision-with-3d-physics-engine.md

## Objective

Deliver Cannon-backed 3D physics as the default and only simulation model:

1. Prototype in Storybook to validate clipping behavior.
2. Keep simulator/renderer/storybook wiring stable on the unified physics pipeline.
3. Validate clipping and movement behavior under the single physics implementation.

## Delivered Scope (completed)

- Storybook prototype work:
  - Added Cannon dependency and clipping helper module.
  - Added canvas debug prototype story with baseline + stress variants.
  - Added Pixi-rendered prototype story (physics -> ECS -> stream -> renderer path).
  - Added deterministic clipping helper tests.
- Simulator integration work (items 1-7 progression):
  - Removed `physicsMode` and legacy-mode gating; physics is always active.
  - Added new 3D state components:
    - `PositionZ`
    - `VelocityZ`
    - `Grounded`
  - Added `physics3dSystem` using Cannon world/bodies:
    - Floor: infinite plane.
    - Walls: static boxes (from `FloorTile + Obstacle`).
    - Bots/Hero: dynamic spheres (from `ObstacleSize`).
    - Food: non-blocking boxes.
  - Added physics run pipeline branch in `runTics`:
    - `heroPath -> urge -> physics3d -> consumption`
  - Updated render stream schema to include 3D state components.
  - Added simulator-level regression tests for physics behavior:
    - no-clipping-through-wall corridor test.
    - deterministic same-seed same-setup test.
    - vertical-state component update test.

## Still Out of Scope (current delivery stage)

- Full replacement/removal of legacy 2D systems in all gameplay paths.
- Network protocol/schema upgrades beyond local render schema additions.
- Final gameplay tuning for movement feel and jump behavior.
- Full migration of every feature/system to consume vertical state.

## Task Status

1. Add `cannon-es` dependency for Storybook and simulator: **Done**
2. Implement physics prototype helper module: **Done**
3. Implement Storybook prototype stories (canvas + Pixi path): **Done**
4. Add clipping metric + stress controls: **Done**
5. Add deterministic unit tests for clipping helper: **Done**
6. Integrate physics into simulator run pipeline: **Done**
7. Add simulator-level clipping/determinism regression tests: **Done**
8. Update render/schema serialization for 3D state: **Done**

## Success Criteria (current stage)

- Storybook prototypes compile and run in both debug-canvas and Pixi-stream paths.
- Cannon-backed simulator physics is the only mode.
- New physics simulator tests pass and demonstrate no wall clipping in corridor scenario.
- Render schema includes 3D state for downstream renderer/inspector usage.
