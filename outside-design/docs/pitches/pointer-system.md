---
Title: Pointer System — In-Game Pointer and Pointable
Category: Interaction
---

# Pointer System — In-Game Pointer and Pointable

## Motivation

Today there is no in-game representation of where the player is pointing. There is currently no input methods to interact with the new simlation and the new renderer. There is no hover feedback or possible actions on click.

An in-game pointer, a tile coordinate and optionally the entity under it, would provide clear affordances, improve usability, and create a foundation for future interactions such as "character points at X" or NPC pointers. This pitch scopes the first step: a player-driven pointer in the test renderer, with a **pointable** concept so the system knows what can be pointed at.

## Solution

Introduce an **in-game pointer** that tracks the current tile (and optionally the **pointable** entity at that tile). The first pointer source is the **player's mouse**: the tile coordinate under the cursor in the viewport. A **Pointable** component (or tag) marks entities that participate in pointer resolution—floor tiles, walls, bots—so the renderer can change the pointer visual based on what is under the pointer (empty, floor, wall, bot).

This pitch is Storybook-first: the test renderer shows the pointer visual and implements demo click behavior (add floor, toggle wall, remove tile, follow bot). The same concepts can later be reused in the game client.

## Inclusions

**Pointer and pointable**

- In-game pointer state: current tile coordinate (e.g. `{ x, y }` in floor grid resolution); optional: entity under pointer (if any).
- **Pointable** component (or tag): entities that can be the target of the pointer (floor tiles, walls, bots).
- First pointer source: **player mouse** → tile coordinate derived from viewport/screen (test renderer: Storybook simulator viewport).

**Test renderer (Storybook)**

- Default pointer visual: **50% transparent, dotted 1 px white** box drawn on the pointed tile.
- When a **floor tile** is at that coordinate: pointer visual at **100% opacity** (same dotted white style).
- When a **bot** is at that coordinate: pointer visual switches to a **solid green** box (same 1 px stroke, different style).
- When a **wall** (or other pointable) is at that coordinate: behaviour to be decided (see Open Questions).

**Demo behavior (Storybook, click)**

- Click **empty** (no floor): **add a floor tile** at that tile.
- Click **floor tile**: **turn it into a wall** (walkable → unwalkable / obstacle).
- Click **wall**: **remove the tile** (entity removed).
- Click **bot**: **viewport centers on that entity** and **starts following** it (camera follow / follow mode).

## Exclusions

- No NPC or character pointers in this pitch (player mouse only).
- No sub-tile pointer precision (tile-only).
- No sound or extra VFX.
- No change to the outside-client game loop or tap routing; demo and pointer visual are Storybook-only unless a follow-up pitch extends them.

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

- Pointer state: tile `(x, y)` in floor grid resolution; optional reference to the entity under the pointer (for pointable entities).
- Pointable: tag or component on FloorTile, Obstacle (wall), and bot prefabs (or equivalent) so a single "what is at (x, y)" lookup returns entity and kind.
- Test renderer: one pointer visual layer (e.g. SVG); style by target under pointer: default → 50% dotted white; floor → 100% dotted white; bot → solid green; wall → per Open Question.
- Demo clicks: same tile resolution as pointer; dispatch by target type (empty / floor / wall / bot) to spawn floor, toggle floor→wall, remove wall, or center+follow bot.
- When a valid pointerTarget entity is pointed at by the mouse, change the browser cursor style to a hand.
