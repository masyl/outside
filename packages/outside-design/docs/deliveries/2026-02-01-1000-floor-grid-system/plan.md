# Implementation Plan: Floor and Grid System

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Add grid and floor systems to outside-simulator: grid entities (prefab + gridResolution, id), two default grids (floorTiles resolution 1, subPositionSnap resolution 0.125), utility to snap coordinates, and floor tiles (position = bottom-left in world space, walkable tag). Movement applies first; a floor system then detects entity–floor overlap with unwalkable tiles, moves the entity back to a valid position, and bounces direction. Storybook: render grid lines (viewport-clipped, floorTiles 30% white solid, subPositionSnap 10% white dotted), floor tiles as dark grey squares (under grid, under entities); simple demos = rectangle areas, complex = dungeon-style layout (global utility in Storybook, not in simulator). No new package; no grid extent (viewport defines what we draw).

## Architectural Principles

1. **Simulator + Storybook only** — grid and floor are simulator prefabs, components, systems; Storybook spawns demo layouts and renders (no outside-client changes).
2. **Default grids on world creation** — createWorld adds two grid entities: floorTiles (resolution 1), subPositionSnap (resolution 0.125).
3. **Floor response: move back + bounce** — movement applies; floor system detects entity–floor overlap with unwalkable; then correct position and reflect direction (bounce).
4. **Registration point** — floor tile Position is the bottom-left corner (origin) of the tile in world space.
5. **No new dependencies** unless required and approved. Dungeon generation is a Storybook-side utility (inspired by agent-collab sample), not in simulator.

---

## 1. Grid: components and prefab (outside-simulator)

- [x] Add grid components: **Grid** (tag), **GridResolution** (SoA value); GridId omitted.
- [x] Default grids in world-defaults (addDefaultGrids); no prefab for two fixed grids.
- [x] Run codegen; GridResolution registered via components index.

---

## 2. World creation: default grids (outside-simulator)

- [x] createWorld calls addDefaultGrids; two grid entities (floorTiles 1, subPositionSnap 0.125).
- [x] world-defaults.ts; createWorld calls it after registerPipelineObservers.

---

## 3. Utility: snap to grid (outside-simulator or outside-utils)

- [x] snapToGrid in packages/outside-utils/src/grid.ts; tests in outside-utils.
- [x] Document: resolution relative to integer coordinate system.

---

## 4. Floor: components and prefab (outside-simulator)

- [x] Floor components: FloorTile, Walkable; Position (bottom-left), Size (cell 1).
- [x] spawnFloorTile(world, x, y, walkable) in prefabs/floor.ts; exported from index.
- [x] Codegen and observers via components index.

---

## 5. Floor system: overlap detection, move back, bounce (outside-simulator)

- [x] floorSystem(world): after movement, circle–AABB overlap with unwalkable FloorTile; revert to PreviousPosition, Direction angle + π.
- [x] PreviousPosition set in movement system before updating Position.
- [x] Pipeline: urge → movement → floorSystem → collision; run.ts updated.

---

## 6. Storybook: render grid lines (viewport-clipped)

- [x] In SimulatorRenderer (or a GridOverlay component), for each grid entity in the world (query Grid + GridResolution):
  - Compute grid lines that intersect the current viewport (viewBox in world coordinates: e.g. center 0,0, width 1600/20, height 1200/20 in tile space, or pass bounds).
  - floorTiles (resolution 1): draw only visible lines, 30% white solid 1px.
  - subPositionSnap (resolution 0.125): draw only visible lines, 10% white dotted 1px.
- [x] Render grid layer above floor tiles and below entities (z-order or SVG order: floor shapes first, then grid lines, then entities).
- [x] No grid extent: viewport bounds define which lines to draw (infinite grid clipped to viewport).

---

## 7. Storybook: render floor tiles

- [x] For each FloorTile entity (query Position, Size, FloorTile), draw a solid dark grey square. Position = bottom-left; Size defines width/height (e.g. 1×1).
- [x] Render floor tiles under grid lines and under entities (first in SVG order).
- [x] Walkable vs unwalkable: same visual for now (dark grey) or optional distinct color for debug.

---

## 8. Storybook: demo layouts

- [x] **Simple**: spawn floor tiles in a rectangle (e.g. [xMin, xMax] × [yMin, yMax] with floorTiles resolution 1). Use a spawn function (e.g. `spawnFloorRect(world, xMin, yMin, xMax, yMax, walkable)`).
- [x] **Complex**: add a dungeon-style layout generator as a global utility (e.g. in outside-storybook or a shared util), inspired by agent-collab/dungeonMapGeneratorSample.ts; build and test it; use it from a Storybook story to spawn floor tiles. Not baked into the simulator.

---

## 9. Tests (outside-simulator)

- [x] Unit test: snapToGrid in outside-utils (resolution 1 and 0.125).
- [x] Unit test: floor system — entity moves into unwalkable tile, position reverted (bounce direction in code).
- [x] Unit test: floor system — entity on walkable tile is unchanged.
- [x] World creation creates two grid entities with correct resolutions (floor.test.ts).

---

## Master Checklist

- [x] Grid components (Grid, GridResolution) and default grids in createWorld
- [x] createWorld adds floorTiles and subPositionSnap grids
- [x] snapToGrid utility (outside-utils)
- [x] Floor components (FloorTile, Walkable) and spawnFloorTile
- [x] floorSystem: detect overlap, move back, bounce
- [x] Pipeline: urge → movement → floorSystem → collision
- [x] Storybook: grid lines (viewport-clipped, floorTiles solid 30% white, subPositionSnap dotted 10% white)
- [x] Storybook: floor tiles as dark grey squares (under grid, under entities)
- [x] Storybook: simple rect layout demo
- [x] Storybook: dungeon-style layout utility and story (optional, can follow)
- [x] Tests: snap, default grids, floor system revert, walkable pass-through

---

## 10. Additional refinements (post-plan)

These changes were made after the initial plan was completed. They refine collision behaviour, movement feel, and debugging visuals.

### 10.1 Obstacle collision (replaces floor system)

- [x] **Walls as obstacles**: spawnWall adds FloorTile + Obstacle (no Walkable). Obstacle collision system runs every N tics; detects mover–obstacle (circle–AABB) overlap.
- [x] **No checkpoint**: Resolve from current position — push circle out along wall normal, then bounce direction (reflect velocity off normal). Removed ObstacleCheckPosition and revert-to-checkpoint; movement looks natural.
- [x] **Collided component**: Cooldown in tics (ticksRemaining). Set on mover and on obstacle when collision is applied. Decremented every tic. Obstacle system skips response when mover has cooldown and is moving away from wall.
- [x] **Reflect angle**: Bounce uses wall normal (from closest point on AABB to circle); new angle = reflect(velocity, normal). Straight-on → 180°; 45° → -45°.
- [x] **Check frequency**: Obstacle check every 2 tics (was 4) to reduce fast bots passing through walls. Collided cooldown = 2 tics to match.

### 10.2 Bots as obstacles; entity–entity collision

- [x] **Bots as obstacles**: Bot prefab gets Obstacle + Size (diameter = obstacle diameter). Obstacle collision treats other bots as AABB obstacles; mover–bot overlap → push out, bounce, Collided, 50% speed. Self-collision skipped (obsEid === eid).
- [x] **Entity–entity collision**: Collision system adds Collided to both entities with cooldown = 2; skips pair when both have cooldown and are moving away from each other. 50% speed reduction on both when collision is recorded.

### 10.3 Speed reduction on collision

- [x] **Obstacle collision**: When mover hits wall or bot, Speed.tilesPerSec *= 0.5 (if > 0).
- [x] **Entity–entity collision**: When two entities overlap and we record the event, both get Speed.tilesPerSec *= 0.5.

### 10.4 Visual size vs obstacle size

- [x] **VisualSize and ObstacleSize**: Replaced single Size with VisualSize (rendering) and ObstacleSize (collision). Bot default visual 1.2, obstacle 0.8. Storybook renders circles from VisualSize; collision/obstacle systems use ObstacleSize.

### 10.5 Wander and movement feel

- [x] **Wander**: Direction change ±15° max (was full random angle); persistence 10–30 tics (was 20–60) so direction changes twice as often. Subtler, more natural wandering.
- [x] **Urge 'none'**: spawnBot option urge: 'none' so entity keeps initial direction/speed (no urge updates). Used in determinism and API tests for fixed movement.

### 10.6 Storybook visuals and dev workflow

- [x] **Velocity arrows**: 50% shorter (ARROW_SCALE = 1); pointy arrowhead at tip (polygon). Follow lines use Array.from(query(...)) for correct JSX typing.
- [x] **Collided debug**: Entities with Collided cooldown > 0 drawn blue (#44f), fillOpacity/strokeOpacity = ticksRemaining / 2 (fade 100% → 0%). Wall tiles (FloorTile + Obstacle) with Collided drawn blue (#6af) with same fade. SimulatorEntity accepts optional fillOpacity, strokeOpacity.
- [x] **Vite alias**: Storybook vite.config resolves @outside/simulator to simulator source (../outside-simulator/src/index.ts) so simulator changes apply without rebuilding the package.

### 10.6 Cleanup

- [x] ObstacleCheckPosition component removed (no longer used).
- [x] floor.test.ts: "pushes bot out and bounces" (no revert wording). api.test.ts: drain test uses urge 'none', tilesPerSec 0 for deterministic overlap.

---

## Notes

- Grid extent and world bounds deferred; viewport defines drawing.
- Multiple floor layers and floor tile subtypes (wall, grass, etc.) are out of scope (next pitches).
- Reference: [agent-collab/dungeonMapGeneratorSample.ts](agent-collab/dungeonMapGeneratorSample.ts) for dungeon layout inspiration only; implement and test own version in Storybook.
