---
Title: Grid boundary outline
Category: Core
Status: draft
---

# Grid boundary outline

## Motivation

The playable or logical grid area should be visually clear so designers and players know where the "board" or level boundary is. A dotted outline at the grid boundary provides that clarity without changing simulation behavior.

## Solution

Draw a **dotted outline** at the grid boundary. The boundary can be derived from the same grid used by the simulator (e.g. extent in tiles) or from a separate config; the pitch focuses on the visual outline (style: dotted line, optional thickness). No collision or movement enforcement is required in this pitch.

## Inclusions

- **Outline rendering** at the grid boundary (viewport or world space, as appropriate).
- **Style**: dotted line; line thickness and color can follow existing design tokens or defaults.
- The boundary **extent** comes from config or from the same grid definition used elsewhere (e.g. outside-simulator grid resolution and extent, or client config).

## Exclusions

- No enforcement of movement or collision at the boundary in this pitch.
- No change to simulation rules; the outline is visual only.
- No multiple outlines or layered boundaries.

## Pre-requisites

- A defined grid or level extent (e.g. from default terrain pitch, or existing grid config).
- Client or Storybook renderer that can draw lines (e.g. SVG or canvas).

## Open Questions

- Should the outline be in world coordinates (scrolls with the view) or fixed to the viewport?
- Same extent as "default terrain" level boundary or independent?

## Next Logical Pitches

- World bounds that affect movement or spawning.
- Different boundary styles (e.g. solid, animated).

## Implementation Details (use sparingly)

- Can reuse grid or extent from **outside-simulator** or **outside-utils** (e.g. GridResolution, level extent config) if the boundary is meant to match the logical grid. Rendering is client- or Storybook-only (e.g. SVG path or canvas stroke). No ECS changes required.
