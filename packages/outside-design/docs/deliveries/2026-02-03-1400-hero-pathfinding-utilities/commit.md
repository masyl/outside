# Commit preparation: Hero and Pathfinding Utilities

For use when merging the feature branch (squash and merge).

## Title

feat(simulator): Hero and pathfinding utilities

## Body

- Hero tag and spawnHero prefab; no Wander/Follow/Wait; movement via hero path system.
- Pathfinding: getPassableTiles, findPath (A*), simplifyPath (string-pulling/LOS).
- Hero path: orderHeroTo, getHeroPath, heroPathSystem (6 tps); path storage via WeakMap.
- Storybook: HeroAndPathfinding story (floor rect + hero); DungeonWithHero story (dungeon, 12 food, 9 bots, 1 hero).
- Click floor orders hero when viewport follows hero; path dotted yellow, checkpoints yellow boxes.

References: pitch [hero-pathfinding-utilities](./pitch.md), plan [plan.md](./plan.md).

## Tags

- delivery/2026-02-03-1400-hero-pathfinding-utilities
