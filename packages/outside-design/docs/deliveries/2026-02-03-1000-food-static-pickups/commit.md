# Commit preparation: Food in the Dungeon — Static Pickups

For use when merging the feature branch (squash and merge).

## Title

feat(simulator): Food in the Dungeon — static pickups

## Body

- Food component and spawnFood(world, { x, y }) prefab; Position, Size (diameter 0.5), Food tag; no Obstacle (walk-through).
- ConsumedEvent and consumptionSystem: bot–food overlap ⇒ remove food, emit event; one food per bot per tic.
- Pipeline: urge → movement → consumption → obstacleCollision → collision.
- Storybook: render food (green circles); spawnDungeonWithFood; FloorGridDungeonWithFood story.
- Tests: consumed event when bot overlaps food; type narrowing for SimulatorEvent union.

References: pitch [food-static-pickups](./pitch.md), plan [plan.md](./plan.md).

## Tags

- delivery/2026-02-03-1000-food-static-pickups
