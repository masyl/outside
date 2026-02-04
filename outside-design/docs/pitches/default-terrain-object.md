---
Title: Default terrain object and level boundaries
Category: Core
Status: draft
---

# Default terrain object and level boundaries

## Motivation

Levels need a default terrain type so the playable area has a clear floor, and a defined extent so we know where the "level" ends. Without a default terrain and visible boundaries, the world feels unbounded and placement rules are unclear. Objects placed outside the intended area should still be supported for flexibility (e.g. spawning, debugging).

## Solution

Introduce a **default terrain** as the first or standard object type for the ground layer, and a **level extent** (e.g. a fixed size or config such as "100 tiles per side beyond center"). Draw a **thick dashed line** at the level boundary for clarity. Allow objects to exist outside the boundary; the boundary is visual and optionally used for rules (e.g. spawn inside, wrap, or clamp in a later pitch).

## Inclusions

- A **default terrain** type or prefab used for the ground layer (e.g. single tile type, or a simple floor entity).
- A **level extent** or configuration (e.g. width/height, or "N tiles from center") that defines the nominal playable area.
- **Boundary rendering**: a thick dashed line at the level boundary (viewport or world space).
- A clear rule for **objects outside the boundary**: they are allowed; whether movement or spawn is clamped/wrapped is out of scope or deferred.
- Use the default terrain to **fill the level area** (e.g. cover the extent with floor tiles or one large terrain entity).

## Exclusions

- No multiple terrain types or terrain switching in this pitch.
- No automatic clamping or wrapping of entity movement at the boundary (can be a follow-on).
- No loading/saving of terrain layout in this pitch.

## Pre-requisites

- Grid and floor system (e.g. floor tiles, grid resolution) so terrain aligns to the grid.
- Simulator or client support for spawning terrain entities (e.g. existing floor/terrain prefabs).

## Open Questions

- Is the default terrain one big entity or a grid of tiles?
- Should the boundary affect simulation (e.g. world bounds) or remain visual only in this pitch?

## Next Logical Pitches

- World bounds: clamp or wrap movement at the boundary.
- Multiple terrain types (grass, water, etc.).
- Save/load level layout including terrain.

## Implementation Details (use sparingly)

- If terrain is simulated in **outside-simulator**, use the existing floor/terrain pattern (e.g. FloorTile, Walkable, Position, Size) and a spawn helper (e.g. spawnFloorRect or equivalent) to fill the level extent. The boundary can be a client-side or world config (e.g. extent in tiles); the thick dashed line is drawn by the client or Storybook from that config.
