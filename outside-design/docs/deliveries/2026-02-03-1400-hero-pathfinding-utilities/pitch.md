---
Title: Hero and Pathfinding Utilities
Category: Interaction
---

# Hero and Pathfinding Utilities

## Motivation

The player needs a character they directly control. That character should not move on its own but await orders from the user. Clicking on the floor should order the character to that location. A pathfinding algorithm and visible path and checkpoints make the order clear and give feedback that the command was understood.

## Solution

Introduce a **Hero**: a prefab and component representing the player-controlled character. The hero is 100% white, is selected by default as the entity followed by the viewport, and does not move autonomously (no Wander, Follow, or Wait). When the user clicks on a walkable floor tile, the hero is ordered to that location. The sequence is:

1. A pathfinding algorithm charts a course from the hero's position to the target tile (walkable tiles only).
2. As the hero reaches each checkpoint, the checkpoint is removed and the hero moves on to the next.
3. When the hero reaches the destination, he stops and waits.

The path is drawn as a dotted yellow line; checkpoints are small yellow outlined boxes at 50% of tile width.

## Inclusions

- **Hero prefab and Hero component** — Tag component; prefab with Position, Direction, Speed, VisualSize, ObstacleSize, Obstacle, PointerTarget (same movement-related components as bot) but **no** Wander, Follow, or Wait.
- **Hero as default viewport follow** — When a hero is spawned (e.g. in a demo), the viewport follow target is set to that hero so the camera follows the player character by default.
- **Hero does not move autonomously** — Only path-follow drives the hero's direction and speed; when path is empty, hero is idle.
- **Click floor → order hero to location** — When the viewport is following a hero and the user clicks a walkable floor tile, the simulation orders that hero to the clicked tile (pathfind and set path).
- **Pathfinding** — Tile-grid pathfinding over walkable floor only (FloorTile + Walkable, excluding Obstacle tiles). Algorithm (e.g. A* or BFS) is an implementation detail.
- **Path storage and consumption** — Path stored as a list of tile waypoints; each tic the hero moves toward the first waypoint; when close enough, the waypoint is removed; when the path is empty, the hero stops.
- **Path and checkpoint visuals** — Dotted yellow line between consecutive waypoints; small yellow outlined boxes at each waypoint (50% of tile width), drawn by the test renderer from simulation path state.

## Exclusions

- Multiple heroes or selection UI (single hero per demo for this pitch).
- NPC pathfinding or AI using the same pathfinding (future pitch).
- Combat, abilities, or other hero actions.
- Path smoothing or sub-tile path precision.

## Prerequisites

- Pointer system: resolveEntityAt, click on floor, viewport follow (IsViewportFocus).
- Floor/wall layout: Walkable, Obstacle, FloorTile so pathfinding has a well-defined passable set.

## Open Questions

- None; pathfinding algorithm (A* vs BFS) is an implementation detail.

## Suggested follow-ups

- Multiple heroes and selection.
- NPC pathfinding reusing the same utilities.
- outside-client integration: same hero and orderHeroTo API.
