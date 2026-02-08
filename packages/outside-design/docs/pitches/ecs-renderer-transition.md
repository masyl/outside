---
Title: Pixi Renderer for ECS Core
Category: Rendering
Summary: Pixi-based renderer decoupled from sim; BitECS observer stream; tiles + entities only.
DeliveryLink: /deliveries/2026-02-07-1600-ecs-renderer-transition/
---

# Pixi Renderer for ECS Core

## Motivation

The current renderer is tightly coupled to the legacy simulation model. The new ECS simulation core needs a renderer that is decoupled, consumes a streaming event interface, and can evolve independently. This will make the game architecture clearer, reduce technical debt, and enable future features without dragging simulation logic into rendering.

## Solution

Create a new Pixi-based renderer package that owns its own BitECS world, receives simulation deltas via a BitECS observer stream, and renders tiles and entities only. The renderer does not run simulation systems; it only runs animation systems for walk cycles based on the incoming state.

## Inclusions

- A new package `@outside/renderer` built on Pixi (latest version in repo).
- Renderer owns its own BitECS world for display state.
- Simulation-to-render sync via BitECS observer stream (delta buffers after initial snapshot).
- Rendering scope: floor tiles, walls/obstacles, bots, hero, and food.
- Directional walk animation tied to entity speed; no smoothing between tics.
- Storybook section showing the renderer in action.
- Missing sprites filled with `@hackernoon/pixel-icon-library` and documented.

## Exclusions

- Timeline and time travel features.
- Debug windows or editor overlays.
- Animation systems beyond basic walk/idle directional sprites.
- Full migration of legacy renderer behavior or UI.

## Prerequisites

- ECS simulation core in `@outside/simulator` with observer stream support.
- Storybook infrastructure already in place.

## Open Questions

- None for this pitch.

## Next Logical Pitches

- Debug overlays and diagnostics for the renderer.
- Extended animation system (attack, idle variants, effects).
- Rendering input layer and interaction primitives.
