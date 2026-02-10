---
Title: Auto-Generated Ground Shadows for Bots and Food
Categories:
  - Rendering
  - ECS
Tags:
  - shadows
  - rendering
  - ecs
  - bots
  - food
---

# Auto-Generated Ground Shadows for Bots and Food

## Motivation

Bots and food can look visually detached from the floor in some scenes. We want a lightweight depth cue that is consistent with pixel art, easy to tune, and cheap to render at runtime.

## Solution

Add ECS-driven ground shadows for bots and food, rendered as generated sprite textures (not per-frame dynamic shape drawing). Shadows are elongated ovals with an opaque center that fades to full transparency at the edge, then drawn under entities with fixed render opacity.

Shadow generation is lazy: the app generates a shadow sprite only when a new shadow size is requested, caches it, and reuses it across matching entities.

## Inclusions

- **`shadow` ECS component data** on supported entities/prefabs.
- **Tile-based sizing** in the component:
  - `shadow.x`: horizontal radius/width value in tile units (`1 = 1 tile`)
  - `shadow.y`: vertical radius/height value in tile units (`1 = 1 tile`)
- **No ECS alpha field** for shadows.
- **Lazy sprite generation** for shadows by requested size key.
- **Shadow texture cache** so same-sized shadows reuse generated sprites.
- **Renderer behavior**:
  - draw cached/generated shadow sprite under entity
  - draw sprite at fixed global shadow opacity (40%) by default
  - use hardcoded food preset opacity that is slightly more opaque than bots (still not ECS-configurable)
- **Prefab defaults**:
  - bots: standard shadow size and opacity preset
  - food: slightly smaller shadow and slightly more opaque preset
- **Size clamping**:
  - `shadow.x` max: `2.0` tiles
  - `shadow.y` max: `0.5` tiles

## Exclusions

- No directional or time-of-day lighting.
- No per-entity shadow alpha in ECS.
- No app-start pre-generation of all shadow textures.
- No rollout to all entity types in this pitch.
- No geometry-aware occlusion or blur/post-processing.

## Implementation Details (use sparingly)

- Introduce a shadow cache keyed by quantized tile size (for example: `x:y`).
- On render, when an entity with `shadow` is encountered:
  - clamp component values to limits
  - request cached sprite by clamped size
  - generate and cache sprite only on first miss
  - render the sprite beneath the entity visual
- Keep generation/style constants centralized to simplify tuning.

## Pre-requisites

- Existing ECS prefab flow for bots and food entities.
- Renderer support for stable draw ordering (shadow below entity visual).
- Access to tile-size-to-pixel conversion used by renderer.

## Open Questions

- Should size values be interpreted as radius or full diameter internally, as long as the external ECS unit remains tile-based?
- Should cache key quantization be fixed precision (for example 2 decimals) to avoid excessive near-duplicate textures?

## Next Logical Pitches

- Extend `shadow` component usage to hero, props, and pickups.
- Add optional height-aware scaling for jump/floating states.
- Add optional directional shadows behind a renderer feature flag.
