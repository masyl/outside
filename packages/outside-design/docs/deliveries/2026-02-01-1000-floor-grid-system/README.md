---
Title: Floor and Grid System
DeliveryDate: 2026-02-01
Summary: Grid and floor in outside-simulator; obstacle collision (push out + bounce, no checkpoint); bots as obstacles; Collided cooldown; VisualSize/ObstacleSize; Storybook rect and dungeon demos.
Status: DONE
Branch: feature/floor-grid-system
Commit: 602dd3c
---

# Floor and Grid System

Completion: 2026-02-01  
Branch: feature/floor-grid-system  
Tag: delivery/2026-02-01-1000-floor-grid-system

Grid and floor systems in outside-simulator with default grids (floorTiles, subPositionSnap), floor tiles, and walls. Obstacle collision resolves overlap by pushing out along the wall normal and reflecting direction (no checkpoint). Bots are obstacles so bot–bot and bot–wall collisions are handled; Collided cooldown and 50% speed reduction on collision; VisualSize/ObstacleSize split; subtler wander; Storybook rect and dungeon demos with Collided debug (blue fade on entities and wall tiles).

## Summary

- **Grid**: Grid (tag), GridResolution; two default grids; snapToGrid in outside-utils.
- **Floor**: FloorTile, Walkable, Size; spawnFloorTile, spawnFloorRect, spawnWall (Obstacle).
- **Obstacle collision**: Push out + reflect; Collided cooldown (2 tics); check every 2 tics; skip when moving away.
- **Bots as obstacles**: Obstacle + Size on prefab; 50% speed on collision; entity–entity Collided on both.
- **VisualSize/ObstacleSize**: Bots use visual 1.2, obstacle 0.8; rendering vs collision.
- **Wander**: ±15° max, 10–30 tics persistence; urge 'none' for tests.
- **Storybook**: Grid lines, floor/wall tiles; rect and dungeon layouts; velocity arrows (shorter + arrowhead); Collided blue fade; Vite alias to simulator source.

## Documents

- [Pitch](./pitch.md)
- [Plan](./plan.md)
- [Delivery Report](./delivered.md)
- [Testing Report](./testing.md)
- [Commit Preparation](./commit.md)
