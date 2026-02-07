---
Title: Pointer System — In-Game Pointer and Pointable
Category: Interaction
---

# Pointer System — In-Game Pointer and Pointable

## Motivation

Today there is no in-game representation of where the player is pointing. There is currently no input methods to interact with the new simlation and the new renderer. There is no hover feedback or possible actions on click.

An in-game pointer, a tile coordinate and optionally the entity under it, would provide clear affordances, improve usability, and create a foundation for future interactions such as "character points at X" or NPC pointers. This pitch scopes the first step: a player-driven pointer in the test renderer, with a **pointable** concept so the system knows what can be pointed at.

## Solution

Introduce an **in-game pointer** that tracks the current tile (and optionally the entity under it), and **viewport state** (center and which entity is followed) as **simulation/ECS concepts**. The first pointer source is the **player's mouse**: the tile coordinate under the cursor. A **PointerTarget** tag marks entities that participate in pointer resolution—floor tiles, walls, bots. Any renderer (Storybook or game client) **reads** this state from the simulation and **writes** pointer and viewport updates back into the simulation; rendering and input are not limited to Storybook.

## Simulation vs renderer

**All of the following are part of the simulation (ECS), not renderer-specific:**

- **Pointer state** — Current tile coordinate and optional entity-under-pointer. Lives in the simulation (e.g. a Pointer entity or world-level state); input (mouse → tile) is fed into the simulation; any renderer reads pointer state from the simulation to draw the pointer visual and set cursor.
- **Viewport center / follow** — Where the viewport is centered and which entity (if any) it follows. Lives in the simulation (e.g. View entity, IsViewportFocus component pointing to the followed entity). Any renderer reads this from the simulation to position the camera; commands that change follow target (e.g. "click bot to follow") update the simulation.

Storybook and the game client are **consumers** of this simulation state: they render the pointer and viewport from ECS, and they push input (pointer tile, click-to-follow) into the simulation. The behavior is the same regardless of which renderer is used.

## Inclusions

**Simulation (ECS): pointer and viewport**

- **Pointer state** in the simulation: current tile coordinate `{ x, y }` (floor grid resolution); optional: entity under pointer (if any). Updated when input provides a new pointer tile (e.g. from mouse in any renderer).
- **PointerTarget** tag: entities that can be the target of the pointer (floor tiles, walls, bots). Used by the simulation to resolve "what is at (x, y)" (empty, floor, wall, bot).
- **Viewport state** in the simulation: view center and/or which entity the viewport follows (e.g. View entity with IsViewportFocus component referencing the followed entity). Updated when the user chooses to follow an entity (e.g. click on bot); any renderer reads this to center the camera and follow.

**Test renderer (Storybook)** — reads from simulation, writes input into simulation

- Default pointer visual: **50% transparent, dotted 1 px white** box on the pointed tile (from simulation pointer state).
- When a **floor tile** is at that coordinate: pointer visual **100% opacity** (same dotted white style); when a **wall**: same as floor (100% opacity).
- When a **bot** is at that coordinate: pointer visual **solid green** box (1 px stroke).
- Cursor to hand when pointer is over a PointerTarget entity.
- **Demo click behavior**: click empty → add floor tile (simulation); click floor → turn into wall (simulation); click wall → remove tile (simulation); click bot → set viewport follow target in simulation (IsViewportFocus). Renderer then reads follow target and centers view on that entity.

## Exclusions

- No NPC or character pointers in this pitch (player mouse only).
- No sub-tile pointer precision (tile-only).
- No sound or extra VFX.
- Pointer and viewport state are **not** Storybook-only: they live in the simulation; outside-client can consume them in a follow-up.

## Pre-requisites

- Floor/grid system and tile entities (floor, wall) so "tile at coordinate" and add/remove/toggle are well-defined.
- Bots and viewport so "center on bot" and "follow" are possible.
- Test renderer (Storybook) that can render the pointer visual and receive clicks (existing or tappable-style plumbing).

## Open Questions

- Q: When the pointer is over a **wall** (pointable but not floor): same visual as floor (100% opacity), same as default (50% dotted), or a distinct style (e.g. different color)?
  - A: Same as the other floor tiles
- Q: Should "pointable" be a single tag, or allow kinds (e.g. pointable + kind: floor | wall | bot) for future extensibility?
  - A: A single tag
- Q: Demo: "viewport centers and follows bot"—is that Storybook-only camera behavior, or should the pitch allow a hook for outside-client later?
  - A: Make the renderer viewport center an invisible entity.
  - A: Also, add a isViewportFocus a component that point to the bot (using bitecs relationships) 
- Q: Naming: confirm canonical name—**pointable** vs pointableAt vs pointerTarget.
  - A: Use pointerTarget

## Next Logical Pitches

- NPC/character pointers ("entity A is pointing at tile/entity B").
- Pointer-driven tooltips or context UI.
- Integration with outside-client (pointer state in game view, cursor style, tap routing using same tile).

## Implementation Details (use sparingly)

- **Simulation**: Pointer state (tile x, y; optional entity-under-pointer) and viewport state (e.g. View entity + IsViewportFocus ref to followed entity) are ECS data. Input (pointer tile, click actions) is written into the simulation; resolution "what is at (x,y)" uses PointerTarget and existing components (FloorTile, Walkable, Obstacle, bot).
- **PointerTarget** tag on FloorTile, Obstacle (wall), and bot prefabs. Single tag (no kinds).
- **Renderers** (Storybook first): read pointer and viewport state from the simulation; draw pointer visual and position camera; push pointer move and click events into the simulation (set pointer tile, spawn/toggle/remove tile, set follow target).
- When the pointer is over a PointerTarget entity, cursor style hand (renderer responsibility).
