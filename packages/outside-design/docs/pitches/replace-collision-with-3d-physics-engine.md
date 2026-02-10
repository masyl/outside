---
Title: Replace Collision with 3D Physics Engine
Category: Core
Summary: Migrate from 2D overlap collision to an invisible Cannon-based 3D physics layer driving entity motion.
DeliveryLink: /deliveries/2026-02-09-1507-replace-collision-with-3d-physics-engine/
---

# Replace Collision with 3D Physics Engine

## Motivation

The current collision model is built around simple 2D overlap and response. This constrains movement behavior and makes mechanics like push dynamics, inertia, and jumping harder to model consistently.

A 3D physics layer would provide more coherent motion rules while keeping current sprite rendering as a 2D presentation.

## Solution

Replace the existing collision mechanic with a Cannon-based 3D physics simulation that is invisible to players and used only to update entity positions and velocities.

Simulation entities map to physics bodies:

- Floor as an infinite plane.
- Bots as spheres.
- Walls as boxes (1 unit high).
- Food as smaller boxes.

The simulation adds a third dimension and integrates basic movement/jump behaviors while preserving deterministic fixed-step updates.

## Inclusions

- Introduce physics world setup using Cannon.
- Add `z` axis support to simulation position/velocity data.
- Replace existing collision response path with physics-body interactions.
- Physics shape mapping for floor, bots, walls, and food.
- Basic mechanics:
  - Solid immovable walls.
  - Pushable bots.
  - Walking with inertia/angular momentum characteristics.
  - Basic jumping for bots.
- Demo behavior: bots perform periodic jumps up to `0.8` world units.
- Adapter layer to keep renderer fed with simulation coordinates.

## Exclusions

- No ragdoll, joints, or advanced articulated bodies.
- No full rewrite of all gameplay systems in the same pitch.
- No visual 3D rendering pipeline; physics remains hidden.
- No networking redesign except required state serialization updates.

## Implementation Details (use sparingly)

- Prefer maintained Cannon implementation compatible with current toolchain (for example `cannon-es`).
- Keep fixed-step simulation cadence aligned with existing tick model.
- Use explicit mapping between ECS entities and physics body handles.
- Stage migration to avoid breaking unrelated systems during transition.

## Pre-requisites

- Existing ECS simulation core and deterministic tick loop.
- Agreement on coordinate conventions for introducing `z`.
- Baseline tests around movement/collision behavior to validate migration.

## Open Questions

- Confirm Cannon package choice (`cannon-es` vs alternatives).
- How should grounded/jump state be represented for gameplay rules?
- Which legacy collision-dependent systems migrate in phase 1 vs later phases?
- Should food be dynamic, static, or kinematic in first iteration?

## Next Logical Pitches

- Physics-driven knockback and impulse-based combat interactions.
- Advanced locomotion tuning (friction, acceleration curves, slope handling).
- Physics debug visualization overlays for tooling and balancing.
