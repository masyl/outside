# Implementation Plan: Hero and Pathfinding Utilities

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Add a player-controlled **Hero** (prefab + tag component), pathfinding over walkable floor tiles, path storage and a path-follow system so the hero moves only when ordered. Clicking a floor tile orders the hero to that tile; path and checkpoints are drawn in the test renderer (dotted yellow line, yellow outlined boxes at 50% tile). Hero is 100% white and is the default viewport follow target when spawned.

## Architectural Principles

1. **Hero is ECS-only** — Hero tag and prefab live in the simulator; no autonomous urge (no Wander/Follow/Wait); path-follow system is the only driver for hero movement.
2. **Path lives outside bitecs** — Use a world-level map (e.g. `heroPaths: Map<eid, {x,y}[]>`) or a dedicated module so we avoid dynamic array components; path is consumed checkpoint-by-checkpoint by the hero path system.
3. **Pathfinding uses simulation data** — Passable set from FloorTile + Walkable at integer (x,y), excluding Obstacle; pathfinding module queries the world and returns an ordered list of tile coords.
4. **Renderers consume path state** — Storybook reads path via `getHeroPath(world, heroEid)` and draws path/checkpoints; it does not own path state.
5. **Click floor orders hero only when follow target is hero** — If viewport follow target has Hero and user clicks floor, call `orderHeroTo`; otherwise keep existing click behavior (spawn floor / wall / remove / follow bot).

---

## 1. Simulator: Hero component and prefab

### Checklist

- [ ] Add **Hero** tag component; register in components index and run codegen.
- [ ] Add **prefabs/hero.ts**: spawnHero(world, options?) with Position, Direction, Speed, MaxSpeed, VisualSize, ObstacleSize, Obstacle, PointerTarget; **no** Wander, Follow, Wait. Same movement shape as bot; visual 100% white (renderer interprets via Hero tag).
- [ ] Export spawnHero (and getOrCreateHeroPrefab if needed) from simulator index.

### Notes

- Hero prefab can mirror bot prefab pattern but omit urge components; use a dedicated Hero prefab entity per world.

---

## 2. Simulator: Pathfinding

### Checklist

- [ ] New module (e.g. **pathfinding.ts** or **heroPath.ts**): build passable set from world — query FloorTile + Walkable at integer (x,y), exclude tiles that have Obstacle (or entity with Obstacle at that position).
- [ ] Implement **findPath(world, from: {x,y}, to: {x,y}): {x,y}[]** (A* or BFS); return ordered list of tile coords from start to goal (inclusive or exclusive of start/end as needed by path-follow).
- [ ] Export findPath from simulator index (or keep internal to heroPath if only hero uses it).

### Notes

- Passable = floor tile with Walkable, no Obstacle at that (integer) tile. Use same resolution as pointer (floor grid, integer tiles).

---

## 3. Simulator: Path storage and hero path system

### Checklist

- [ ] **Path storage**: World-level map or module-level map keyed by hero eid: `Map<number, {x,y}[]>`; set when ordering hero, read by system and renderer.
- [ ] **orderHeroTo(world, heroEid, tileX, tileY)**: Get hero Position, call findPath(world, heroPos, {x: tileX, y: tileY}), store result in path map for heroEid. Export from simulator.
- [ ] **getHeroPath(world, heroEid): {x,y}[]**: Return path for hero (or empty array). Export from simulator.
- [ ] **Hero path system** (e.g. **systems/heroPath.ts**): For each entity with Hero: if path non-empty, set Direction toward path[0], set Speed to configurable tps; when distance to path[0] below threshold (e.g. 0.3 tiles), remove path[0]; when path empty, set Speed to 0. Do not add Wait/Wander/Follow.
- [ ] Register hero path system in **run.ts** pipeline (run before urge so hero steering is applied; urge will not affect hero because hero has no urge components).

### Notes

- Threshold for "reached" checkpoint: e.g. distance to center of path[0] < 0.3; then shift path and continue to next.

---

## 4. Storybook: Spawn with hero and default follow

### Checklist

- [ ] New spawn (e.g. **spawnFloorRectWithHero** or variant of createFloorRectSpawn): floor rect + one hero at a valid floor tile + optional other bots. After spawning hero, call **setViewportFollowTarget(world, heroEid)** so the hero is the default follow target.
- [ ] Add story (e.g. "Hero and Pathfinding") that uses this spawn.

### Notes

- Hero spawn position: e.g. center of room or first walkable tile; ensure pathfinding can run from there.

---

## 5. Storybook: Click floor orders hero and visuals

### Checklist

- [ ] **Click floor → order hero**: In SimulatorRenderer handlePointerDown, when resolved.kind === 'floor': if getViewportFollowTarget(world) is non-zero and that entity has Hero component, call **orderHeroTo(world, followEid, tx, ty)** and skip other floor-click behavior; else keep existing behavior (spawn floor / wall / remove / follow bot).
- [ ] **Hero visual**: In entity render loop, if entity has Hero, use fill/stroke **#fff** (100% white).
- [ ] **Path and checkpoint visuals**: For the viewport-followed hero, call getHeroPath(world, heroEid). Draw **dotted yellow** line (polyline or segments) between consecutive waypoints using toX/toY. Draw **yellow outlined** rects at each waypoint at **50% of tile width** (centered on tile). pointer-events: none.

### Notes

- Reuse toX/toY and viewCenter so path lines and checkpoint boxes are in the same coordinate system as the world.

---

## Master Checklist

- [ ] Simulator: Hero component and prefab; pathfinding (findPath); path storage and orderHeroTo, getHeroPath; hero path system in run pipeline.
- [ ] Storybook: spawn with hero and set viewport follow; click floor orders hero when follow target is hero; hero 100% white; path dotted yellow and checkpoints yellow 50% tile boxes.
- [ ] Tests and build pass.

---

## Notes

- Dependencies: Pointer system (resolveEntityAt, setViewportFollowTarget, getViewportFollowTarget), floor/wall (Walkable, Obstacle, FloorTile).
- Path map cleanup: if hero entity is removed, path map entry can be left or cleared on removeEntity; optional follow-up.
