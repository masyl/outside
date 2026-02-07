# Commit preparation: Floor and Grid System

For use when merging the feature branch (e.g. squash and merge). If there are uncommitted changes (50% speed on collision, bots as obstacles, wall tiles Collided color), commit them first or include them in the squash.

## Title

feat(floor-grid): floor and grid system, obstacle collision, bots as obstacles, Collided cooldown

## Body

- Grid: Grid (tag), GridResolution; two default grids (floorTiles 1, subPositionSnap 0.125); snapToGrid in outside-utils.
- Floor: FloorTile, Walkable, Position (bottom-left), Size; spawnFloorTile, spawnFloorRect, spawnWall (Obstacle).
- Obstacle collision: push out along wall normal, reflect direction (no checkpoint); Collided cooldown (2 tics); check every 2 tics; skip when moving away.
- Bots as obstacles: prefab gets Obstacle + Size; bot–bot and bot–wall resolved by obstacle system; 50% speed on collision; entity–entity Collided on both, skip when moving away.
- VisualSize/ObstacleSize split for bots (visual 1.2, obstacle 0.8).
- Wander: ±15° max, persistence 10–30 tics; urge 'none' for fixed movement (tests).
- Storybook: grid lines (viewport-clipped), floor/wall tiles; rect and dungeon demos; velocity arrows shorter + arrowhead; Collided blue fade (entities and wall tiles); Vite alias to simulator source.
- Tests: floor (push-out, bounce, walkable), api, determinism (urge 'none'), urge; ObstacleCheckPosition removed.

References: pitch [2026-02-01-1000-floor-grid-system](./pitch.md), plan [plan.md](./plan.md).

## Tags

- delivery/2026-02-01-1000-floor-grid-system
