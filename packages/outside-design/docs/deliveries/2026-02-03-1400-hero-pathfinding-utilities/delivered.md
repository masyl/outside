# Delivery Report: Hero and Pathfinding Utilities

## Summary

Player-controlled Hero entity with pathfinding over walkable floor. Hero has no autonomous urge; movement is driven only by the hero path system. Click floor to order the hero there; A* pathfinding computes a route, string-pulling simplifies it to the most direct line-of-sight waypoints, and the hero follows at 6 tiles/sec. Storybook: HeroAndPathfinding (floor rect + hero) and DungeonWithHero (dungeon, 12 food, 9 bots, 1 hero).

## Included (from original plan)

- **Hero tag**: Tag component; registered via codegen.
- **spawnHero prefab**: Entity with Position, Direction, Speed, VisualSize, ObstacleSize, Obstacle, PointerTarget, Hero. No Wander, Follow, or Wait.
- **Pathfinding**: getPassableTiles(world), findPath(world, from, to) — A* over walkable floor.
- **Hero path**: orderHeroTo(world, heroEid, tileX, tileY), getHeroPath(world, heroEid); heroPathSystem; path storage via WeakMap outside ECS.
- **Pipeline**: heroPathSystem runs before urgeSystem.
- **Storybook**: spawnFloorRectWithHero, spawnPreset floorRectWithHero; HeroAndPathfinding story; click floor orders hero; hero 100% white; path dotted yellow, checkpoints yellow 50% tile.

## Extras

- **Path simplification**: simplifyPath(passable, path) — string-pulling using Bresenham line-of-sight. Keeps only waypoints where direction must change (no direct LOS).
- **DungeonWithHero story**: spawnDungeonWithFoodAndHero — dungeon layout, 12 food, 9 bots, 1 hero; viewport follows hero.
- **Hero speed**: 6 tiles/sec (HERO_PATH_TPS and maxSpeedTps in hero prefab).

## Test coverage impact

- outside-simulator: 16 tests (unchanged; no new unit tests for pathfinding/hero path).

## Next steps

- Hero inventory or interaction with food.
- Hero health / damage.
- Multiple heroes or party follow.
