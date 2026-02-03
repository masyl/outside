# Floor and Grid System

## Motivation

The legacy proof-of-concept game has grid, floor and tiling features that are typical for a top down rogue style game.

These system and components would be the next logical step to migrated to the new simulation engine. Also, even if the previous features are good in the abstrack, the new ECS approach implies that the same solutions probably do not apply.

## Solution

We should create a new floor system and have the movement system take the floor characteristics into account for a better collision detection.

The main grid itself does not really need any component, as it is derived by the integer part of the coordinates, but since the concept of sub-grid could be a game design option. It's worth having a concept of Grid entities. Larger grids, like 8 times larger, could eventually be used for generating dungeons procedurally.

This first implementation should remain simple: Single layer of floor, a basic floor tile entity, generate demos in storybook that generate a few sample layouts to see how spawning and walking behaves.

The test renderer should show grid lines and dots and boxes for floor tiles.

## Inclusions

### The grid system

- A grid entity prefab
- New grid components:
  - gridResolution : The rounding and/or conversion ratio between the real coordinate system and discreet grid positions.
  - id : To have a user friendly key when debugging.
- A default set of 2 grids:
  - A floorTiles grid with a coordinate resolution of 1
  - An subPositionSnap grid with a coordinate ratio of 0.125 (1/8th)
- The required utility function to round real coordinates to the closest grid snap point.
- A process to render grid lines:
  - Only draw line that are visible in the viewport.
  - floorTiles: a 30% white solid 1px line
  - subPositionSnap: a 10% white dotted 1px line.
- The grid should be rendered over the floor but under entities.

### The floor system

- Entities:
  - floorTile : Each floor tile is position according to the floorTiles grid and occupy that spot.
- Components:
  - position : Reuse existing component
  - walkable : A tag that specify if the floorTile allow for an walking entity to move inside or intersect with the tile area.
- The registration point of each floor tiles is hardcoded to [0,0]
- The floorTile should be rendered as solid dark grey squares.
- The floorTile should be rendered under the grid and entities.


## Exclusions

- No mechanics for multiple layers of floor.

## Pre-requisites

- TBD

## Next Logical Pitches

- Different floorTile sub types: wall, stone, grass, dirt, water.
- Pointers and mouse input
- Bot selection
- System for bots to try to reach a destination on pointer click system

## Implementation Details (use sparingly)

- Do not add any new dependencies unless required and approved.
- Use POC implementation as a vague inspiration, but there is no need to bring back specific behaviors.
- The dungeon generation sample is only an untested example, and you should build your own and test it. The dungeon generation should be a global utility used in storybook, not baked into the simulator.

## Review Questions

- **Q:** The pitch says "The registration point of each floor tiles is hardcoded to [0,0]". What does registration point mean for a floor tile?
  - A: The tile's Position component is the **bottom-left corner** (origin) of the tile; [0,0] is that corner in world space.

- **Q:** For "walkable": when a walking entity would move inside or intersect an unwalkable tile, what should happen?
  - A: **Block movement** — the entity cannot enter; position is clamped or reverted.

- **Q:** You use "gridResolution", "coordinate resolution" (1 for floorTiles), and "coordinate ratio" (0.125 for subPositionSnap). Are these one concept or two?
  - A: The resolution of the grid (aka precision) is alway in comparison to the integer part of the real numbers used by the coordinate system. Meaning that when using a grid with a gridResolution of 0.125, the grid will have 8 discreet snapping positions for each 1 unit of the natural grid.

**Preferences**

- **Q:** Where should the grid and floor systems live?
  - A: The grid an floor are all part of the simulator as entity prefabs, components and systems; In the Storybook, stories will spawn demo floor layouts and render them. The two grids mentionned (floorGrid, subPositionSnap) should be added by default, by the simulator, when an new empty world is created.

- **Q:** For "generate demos in storybook that generate a few sample layouts", how should floor tile positions be defined?
  - A: For simple demo, just create large rectangle areas
  - A: For more complex demos, use a concept similar to the dungeon generator inside this [Typescript example](/Users/mathieu/dev/outside/agent-collab/dungeonMapGeneratorSample.ts)

- **Q:** "Only draw line that are visible in the viewport" — viewport means?
  - A: **Storybook SVG viewBox** in world coordinates (current SimulatorRenderer viewBox; e.g. 1600×1200 logical, center 0,0). Just make sure you dont needlessly try to draw a bunch of line that are not needed and would slow down everything.

**Missing**

- **Q:** Pre-requisites are TBD. Is the current simulator (urge, movement, collision, spawnBot, Storybook renderer) the only prerequisite?
  - A: **Yes** — no other dependencies or new concepts needs to be added.

- **Q:** How should movement "take the floor into account"? When an entity's next position would be on an unwalkable tile:
  - A: **Collision event only** — movement applies; a floor/collision system detects entity–floor overlap. The entity is then moved back to a valid position and it's direction should change as if it bounced.

- **Q:** Do grids have a defined extent (e.g. 20×15 cells) or are they infinite? "Only draw visible" needs an extent.
  - A: **Infinite** — Viewport bounds define what we draw; No grid extent (e.g. draw all lines that intersect viewport). Bound will be added later as game entities.
