---
Title: Soccer Ball Prefab with Rolling Animation, Kicks, and Recoil
Categories:
  - ECS
  - Physics
  - Rendering
  - Interaction
Tags:
  - soccer-ball
  - prefab
  - physics
  - animation
  - bots
Summary: Add a soccer ball prefab using ballgen sprite data, with physics-coupled rolling animation, reflex bot kicks, bounciness tuning, and recoil when bots are hit by fast balls.
---

# Soccer Ball Prefab with Rolling Animation, Kicks, and Recoil

## Motivation

We need a playful, physics-driven object that creates emergent interactions between bots. A soccer ball is a compact testbed for sprite animation tied to motion, proximity-based bot behavior, and impact response.

## External Reference Investigation

- Source project: [mustitz/ballgen](https://github.com/mustitz/ballgen)
- Provided sprite sheet: [blue-ball.all.png](https://raw.githubusercontent.com/mustitz/ballgen/master/examples/blue-ball.all.png)

From the generator and README:

- `make_sprites.py` builds an **NxN composite sprite sheet** from sphere renders at varying camera rotations.
- Frames are generated as `{prefix}_{row}_{col}` and then packed row-major into `{prefix}.all.png`.
- Composite cells are uniform size; for the provided sample, sheet size is `1024x1024` with transparent RGBA background.

This pitch uses that structure as the import contract for ball animation frames.

## Solution

Introduce a **soccer ball prefab** with ECS components for sprite animation, physical behavior, and bot interaction.

The ball visual uses a ballgen-derived sprite sheet and animates according to sphere motion in the physics engine so that movement appears as rolling (not just sliding). Nearby bots can kick the ball reflexively. Fast ball collisions can push bots backward (recoil).

## Inclusions

- **Soccer ball prefab**:
  - physics-backed spherical body
  - renderable sprite using imported ballgen sheet
  - default collider/body values tuned for visible bounce
- **Sprite sheet integration**:
  - importer/metadata for ballgen composite layout (NxN grid)
  - frame addressing based on row/column cells
- **Rolling animation mechanic**:
  - frame selection driven by physics velocity/angular proxy
  - animation rate/direction coupled to movement vector and speed
- **Bot reflex kick behavior**:
  - bots near a ball apply an impulse kick without explicit command
  - kick direction uses bot-to-ball relation and local movement context
- **Interaction components**:
  - `kicker` component on entities allowed to kick
  - `klickable` component on ball for pointer/interaction routing (name kept as requested)
- **Bounciness simplification component**:
  - one ECS component to control rebound feel (rather than tuning many low-level fields per prefab)
- **Recoil on fast impact**:
  - when a ball above speed threshold hits a bot, apply recoil impulse to the bot
  - include minimum cooldown/guard to prevent jitter from repeated micro-collisions

## Exclusions

- No full sports game rules (goals, scoring, teams, referee logic).
- No advanced foot IK or kick animation for bots.
- No network gameplay balancing in this pitch.
- No multi-ball tactical AI.

## Implementation Details (use sparingly)

- Add a prefab recipe for `soccerBall` that composes:
  - physics sphere body + collision
  - sprite animation state and sheet metadata
  - `klickable`
  - `bounciness` tuning component
- Interpret ballgen sheet as uniform grid:
  - detect grid dimensions from metadata/config
  - map linear frame index to `(row, col)` at runtime
- Rolling animation:
  - derive frame progression from ball speed (and optionally projected spin axis)
  - pause on near-zero speed
- Kicking:
  - entities with `kicker` can trigger kick impulse when proximity condition is met
  - apply cooldown to avoid continuous force spam
- Recoil:
  - on bot-ball collision, if relative speed exceeds threshold, apply bot recoil impulse and optional short stun flag (if available)

## Pre-requisites

- Existing ECS prefab system.
- Existing physics engine sphere support and impulse application.
- Existing sprite animation pipeline (or equivalent frame-cycling support).
- Bot sensing/proximity query support.

## Open Questions

- Should `klickable` remain the canonical spelling, or should we alias to `clickable` while preserving backward compatibility?
- Should rolling animation choose frames from a single row (simple loop) or switch rows by movement heading for richer directional illusion?

## Next Logical Pitches

- Goal entities, scoring, and reset rules.
- Bot role behaviors (pass, chase, defend).
- Ball spin effects (curve, friction zones, surface materials).
