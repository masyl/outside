# Delivery Report: Floor and Grid System

## Summary

Grid and floor systems were added to outside-simulator with default grids, floor tiles, and walls. The floor response evolved from “revert + bounce” to an **obstacle collision** system: resolve from current position (push out along wall normal, reflect direction), no checkpoint. Bots are obstacles so bot–bot and bot–wall collisions are handled; Collided cooldown prevents re-bounce; 50% speed reduction on collision. VisualSize/ObstacleSize split, subtler wander, shorter velocity arrows with arrowhead, and Storybook debug (blue fade for Collided entities and wall tiles) complete the delivery.

## Included (from original plan)

- **Grid**: Grid (tag), GridResolution; two default grids (floorTiles 1, subPositionSnap 0.125); snapToGrid in outside-utils.
- **Floor**: FloorTile, Walkable, Position (bottom-left), Size; spawnFloorTile(world, x, y, walkable); spawnFloorRect; spawnWall (FloorTile + Obstacle).
- **Pipeline**: urge → movement → obstacleCollision → collision (floor system replaced by obstacle collision).
- **Storybook**: GridOverlay (viewport-clipped grid lines), FloorTilesLayer (floor/wall tiles), SimulatorRenderer order (floor → grid → entities); rect and dungeon demo layouts; spawnDungeonThenScattered, spawnWallsAroundFloor.

## Additional refinements (post-plan)

- **Obstacle collision (no checkpoint)**: Push circle out along wall normal, reflect velocity angle. Collided component with cooldown (2 tics); skip response when mover has cooldown and is moving away. Obstacle check every 2 tics; cooldown = 2.
- **Bots as obstacles**: Bot prefab has Obstacle + Size (diameter = obstacle size). Mover–bot overlap → push out, bounce, Collided on both, 50% speed on mover. Self-collision skipped.
- **Entity–entity collision**: Collided on both entities; skip pair when both have cooldown and moving away; 50% speed on both when recording collision.
- **Speed reduction**: On any collision (obstacle or entity–entity), Speed.tilesPerSec *= 0.5 when > 0.
- **VisualSize / ObstacleSize**: Replaced single Size for bots; visual 1.2, obstacle 0.8; rendering uses VisualSize, collision/obstacle use ObstacleSize.
- **Wander**: ±15° max direction change; persistence 10–30 tics (twice as often); urge 'none' for fixed movement (tests).
- **Storybook**: Velocity arrows 50% shorter, pointy arrowhead; Collided debug — entities and wall tiles with Collided drawn blue with opacity fading over cooldown; Vite alias to simulator source so changes apply without rebuild.
- **Cleanup**: ObstacleCheckPosition removed; floor and API tests updated (push-out wording, urge 'none' / tilesPerSec 0 for determinism).

## Missing from original plan

- None; plan completed. All post-plan items are documented in plan §10.

## Extras

- Dungeon walls around rooms and corridors; 2-tile-wide corridors; bots spawned only in rooms (no follow across walls).
- Collision system restricted to mobile entities (Position + ObstacleSize + Speed) so floor tiles are not in entity–entity checks.
- Wall tiles and bots both receive Collided when hit (wall tiles change color in Storybook).
- SimulatorEntity supports optional fillOpacity / strokeOpacity for Collided fade.

## Test coverage impact

- outside-simulator: 15 tests (floor, api, determinism, urge). Floor tests assert push-out and bounce; api/determinism use urge 'none' where fixed movement is required. See [testing.md](./testing.md).

## Next steps

- Pathfinding or obstacle avoidance (from urge-system / grid context).
- Optional: more obstacle shapes (e.g. circle–circle for bot–bot if AABB is too boxy).
- Consider exporting OBSTACLE_CHECK_INTERVAL or Collided cooldown for tuning.

## Special mentions

- No new dependencies.
- floorSystem removed; obstacleCollisionSystem is the single obstacle/wall response.
- Storybook dev: Vite alias to simulator source avoids rebuild for simulator changes.
- Delivery slug: `2026-02-01-1000-floor-grid-system`.
