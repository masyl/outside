---
Title: Soccer Ball Prefab and Reactive Kicking
Category: Gameplay
Summary: Add a ballgen-based soccer-ball spritesheet, rolling animation tied to physics movement, and reflexive kick/recoil interactions.
---

# Soccer Ball Prefab and Reactive Kicking

## Motivation

The current simulation has movers, food, walls, and floor, but no neutral dynamic object that can be pushed and kicked around. A soccer-ball-style entity is a good next step for testing richer physics interactions and emergent behavior.

This also creates a reusable foundation for future mini-games and combat-adjacent mechanics (projectiles, knockback, arena interactions).

## Solution

Introduce a dedicated soccer ball entity in the ECS/simulator with a prefab and physics behavior tuned for rolling and bouncing. Bots near a ball should apply a reflexive kick impulse so balls remain active in the scene.

This phase also integrates the `ballgen` spritesheet so balls render as pixel-art sprites with rolling animation driven by physics displacement.

## Inclusions

- New soccer-ball gameplay components (`SoccerBall`, `Kicker`, `Kickable`, `Bounciness`).
- New simulator prefab API to spawn soccer balls.
- New soccer-ball sprite asset pipeline from `mustitz/ballgen`:
  - Source image: `examples/blue-ball.all.png`.
  - Sheet structure: NxN composite from `make_sprites.py`; for provided sheet this is 8x8 frames, 128x128 each (1024x1024 total).
- Physics integration for soccer balls in the Cannon pipeline.
- Reflexive kick behavior: bots close to a ball can kick it.
- Rolling sprite animation mechanic that advances frames from sphere movement in physics.
- Ball-to-bot recoil when a fast-moving ball impacts a bot.
- Initial Storybook scenario to validate ball motion and interactions in a small dungeon.
- Basic tests for prefab/physics behavior.

## Exclusions

- Full soccer game rules (teams, goals, scoring, fouls).
- Network protocol changes.
- Pointer-zoo stories, pointer hover style overrides, and pointer inspector tuning (tracked separately in `2026-02-10-1200-pointer-zoo-and-hover-delivery`).

## Implementation Details (use sparingly)

- Keep implementation deterministic with fixed-step updates.
- Keep kick behavior simple and data-driven through components (`Kicker`, `Kickable`, `Bounciness`).
- Use a sprite-key-based render path (`pickup.ball.soccer`) so ball visuals can evolve independently from food assets.
- Tune physics in a way that avoids unstable explosive impulses.

## Pre-requisites

- 3D physics pipeline already active in simulator.
- Existing Storybook simulator stories for interactive validation.

## Open Questions

- Should kick impulses be only directional (bot facing) or context-sensitive (toward target)?
- What default restitution/damping feels best for readability?
- Should hero be able to kick in phase 1, or bots only?

## Next Logical Pitches

- Soccer goals, score events, and round flow.
- Ball spin animation linked to angular velocity.
- Ball impacts causing bot recoil/knockback.
- Team behaviors around ball possession.
