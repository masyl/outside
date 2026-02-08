# Implementation Plan: Pixi Renderer for ECS Core

## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Global pitch**: ../../pitches/ecs-renderer-transition.md

## Overview

Create a new Pixi-based renderer package `@outside/renderer` that is decoupled from the simulation and synchronized via a BitECS observer stream. The renderer owns its own BitECS world, applies deltas from the simulation, and renders only tiles and entities. It does not run simulation systems, only animation systems (directional walking tied to speed). Storybook receives a new section showcasing the renderer. Missing sprites use `@hackernoon/pixel-icon-library` and are documented.

## Architectural Principles

1. **Decoupled**: Renderer has no dependency on simulation logic; it consumes a stream of ECS deltas.
2. **Event stream sync**: Use BitECS observer serializer/deserializer with `Observed` tag; avoid full-state transfers after initial snapshot.
3. **Render-only ECS**: Renderer runs only render/animation systems; no gameplay systems.
4. **Scope-limited**: Render tiles (floor/walls) and entities (bots, hero, food) only.
5. **Deterministic display**: Directional walk animation is speed-based and aligned to tics; no smoothing between tics.

## 1. Sync Schema and Stream Helpers (outside-simulator)

- Add a render schema export (e.g. `render-schema.ts`) with a canonical `RENDER_COMPONENTS` list for rendering.
- Include at least: Position, VisualSize, Direction, Speed, FloorTile, Walkable, Obstacle, Food, Hero, Observed, and any required tags to infer render kind.
- Add helper `createRenderObserverSerializer(world)` to encapsulate `createObserverSerializer(world, Observed, RENDER_COMPONENTS)`.
- Ensure renderable prefabs/entities include the `Observed` tag so deltas include them.
- Add minimal docs describing the intended sync pattern and delta format expectations.

## 2. New Renderer Package (outside-renderer)

- Create new package `packages/outside-renderer`.
- Dependencies:
  - `pixi.js` (latest version in repo).
  - `bitecs` for render-world ECS.
  - `@outside/simulator` for shared components and serialization compatibility.
  - `@hackernoon/pixel-icon-library` for placeholder icons.
- Export public API:
  - `createRenderWorld(options)`
  - `createRenderer(app, options)`
  - `applyRenderStream(world, packet)`
  - `RenderStreamPacket` type
  - `RENDER_COMPONENTS` re-export
- Implement a render-world ECS layer with render-only components (e.g. RenderKind, AnimFrame, AnimPhase, LastPosition).

## 3. Pixi Renderer Core

- Build a scene graph with separate layers:
  - Tile layer (floor, walls).
  - Entity layer (bots, hero, food).
- Renderable classification rules:
  - FloorTile + Walkable → floor sprite.
  - Obstacle or wall → wall sprite.
  - Food → food sprite.
  - Hero → hero sprite.
  - Default moving entity → bot sprite.
- Directional walk animation:
  - Compute direction from position deltas or Direction component (prefer Direction if authoritative).
  - Walk frame advances based on distance and speed (POC-like).
  - No visual smoothing between tics.

## 4. Event Stream Sync Loop

- Initial snapshot load:
  - Use snapshot serializer once to populate render world.
- Delta stream application:
  - For each tick, apply observer delta buffer through deserializer.
  - Update render-world entities and component data.
- Prevent full-state transfers after initial load.

## 5. Assets and Placeholders

- Reuse existing sprites in `packages/outside-storybook/public/sprites` where possible.
- For missing sprites, use `@hackernoon/pixel-icon-library` and document mappings in `packages/outside-renderer/missing-icons.md`.

## 6. Storybook Integration

- Add new story section (e.g. `Renderer/Pixi ECS`).
- Create a wrapper component that:
  - Spins up a simulator world.
  - Emits delta stream each tic.
  - Applies stream to the renderer instance.
- Add stories:
  - Default (floor + bots).
  - Wall density variant.
  - Hero + food demo.

## Tests

- Unit tests in `@outside/renderer`:
  - Observer stream round-trip: sim → stream → render world yields expected entity set.
  - Render classification correctness by component sets.
  - Walk animation frame progression tied to speed.
- Basic Storybook sanity check for runtime rendering.

## Success Criteria

- Renderer runs with its own ECS world and consumes sim deltas via observer stream.
- Tiles and entities render correctly (floor, walls, bots, hero, food).
- Directional walk animation responds to speed; no smoothing between tics.
- Storybook section demonstrates the renderer.
- Missing sprites are documented and sourced from `@hackernoon/pixel-icon-library`.

## Out of Scope

- Timeline/time travel.
- Debug windows.
- Advanced animation systems beyond walking.
- Full UI migration of legacy renderer.
