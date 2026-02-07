---
title: 'Hero and Pathfinding Utilities Roadmap'
delivery_date: '2026-02-03'
status: 'done'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Hero and Pathfinding Utilities Roadmap

This roadmap tracks the **todos** and **success criteria** for adding the Hero (player-controlled character) and pathfinding utilities to the simulation and Storybook.

Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Simulator ECS** (Hero component, hero prefab)
- **W2: Pathfinding** (passable set, findPath)
- **W3: Simulator path and system** (path storage, orderHeroTo, getHeroPath, hero path system)
- **W4: Storybook** (spawn with hero, click floor orders hero, hero visual, path/checkpoint visuals)

## Agent workflow

1. Complete one todo.
2. Run tests / Storybook and verify.
3. Update roadmap.md.
4. Commit. Then repeat.

## Milestones / Todos

### Phase 0: Simulator — Hero component and prefab

- [x] Hero tag; hero prefab (spawnHero); no urge components; export from simulator.

### Phase 1: Simulator — Pathfinding

- [x] findPath(world, from, to) over walkable floor; export or use in heroPath.

### Phase 2: Simulator — Path storage and hero path system

- [x] Path map; orderHeroTo, getHeroPath; hero path system; register in run pipeline.

### Phase 3: Storybook — Spawn with hero and default follow

- [x] Spawn that adds hero and setViewportFollowTarget(hero); story "Hero and Pathfinding".

### Phase 4: Storybook — Click floor orders hero and visuals

- [x] handlePointerDown: if follow target is Hero and click floor, orderHeroTo; hero 100% white; path dotted yellow and checkpoints yellow 50% tile.

### Phase 5: Post-implementation (extras)

- [x] Path simplification: string-pulling / line-of-sight (simplifyPath, Bresenham LOS).
- [x] DungeonWithHero story: dungeon, 12 food, 9 bots, 1 hero.
- [x] Hero speed: 6 tiles/sec (HERO_PATH_TPS, maxSpeedTps).
