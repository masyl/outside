---
Title: "Hero and Pathfinding Utilities"
DeliveryDate: 2026-02-03
Summary: Player-controlled Hero prefab, pathfinding over walkable floor, path-follow system with line-of-sight simplification, and click-to-move in Storybook.
Status: DONE
Branch: feature/hero-pathfinding-utilities
Commit: 6ea172e
---

# Hero and Pathfinding Utilities

Add a **Hero** (player-controlled character): 100% white, default viewport follow, no autonomous movement. Click floor to order the hero to that tile; pathfinding charts a course, hero follows checkpoints then stops. Path uses string-pulling for line-of-sight simplification (most direct route). Path and checkpoints drawn in Storybook (dotted yellow line, yellow outlined boxes at 50% tile). Hero speed: 6 tiles/sec.

## Summary

- **Hero tag** and spawnHero prefab (no Wander/Follow/Wait).
- **Pathfinding**: getPassableTiles, findPath (A*), simplifyPath (string-pulling/LOS).
- **Hero path**: orderHeroTo, getHeroPath, heroPathSystem (6 tps).
- **Storybook**: HeroAndPathfinding story (floor rect + hero); DungeonWithHero story (dungeon, 12 food, 9 bots, 1 hero).

## Documents

- [Pitch](./pitch.md)
- [Implementation Plan](./plan.md)
- [Roadmap](./roadmap.md)
- [Delivery Report](./delivered.md)
