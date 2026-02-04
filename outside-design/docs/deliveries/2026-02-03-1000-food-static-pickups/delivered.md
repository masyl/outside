# Delivery Report: Food in the Dungeon — Static Pickups

## Summary

Static food entities were added to the simulator: spawnFood(world, { x, y }) creates consumable pickups with Position and Size. When a bot overlaps a food entity, the food is removed and a ConsumedEvent is emitted. Food is walk-through (no Obstacle). Storybook renders food as green circles; FloorGridDungeonWithFood demo spawns 12 food items in dungeon rooms for visual verification.

## Included (from original plan)

- **Food component**: Tag component; registered via codegen.
- **spawnFood prefab**: Entity with Position, Size (diameter 0.5), Food. No Obstacle, no Walkable.
- **ConsumedEvent**: `{ type: 'consumed', entity, foodEntity, x, y }` in SimulatorEvent union.
- **consumptionSystem**: Query bots (Position, ObstacleSize, Speed, Direction) and food (Position, Size, Food); circle–circle overlap; one food per bot per tic; remove food and push event.
- **Pipeline**: urge → movement → consumption → obstacleCollision → collision.
- **Storybook**: Render food (green circles #8b5/#6a4); spawnDungeonWithFood (dungeon + 12 food); FloorGridDungeonWithFood story.

## Missing from original plan

- None; plan completed.

## Extras

- Unit test for consumption (bot overlaps food ⇒ consumed event, food removed).
- Type narrowing in api.test.ts and determinism.test.ts for SimulatorEvent union (CollisionEvent | ConsumedEvent).

## Test coverage impact

- outside-simulator: 16 tests. New test: consumed event when bot overlaps food; food removed; event has correct entity, foodEntity, x, y. See [testing.md](./testing.md).

## Next steps

- Hunger component: bots need to eat periodically.
- Food types (apple, bread) with different effects or durations.
- Food respawn rules (e.g. respawn in same room after N tics).

## Special mentions

- No new dependencies.
- No breaking API changes.
- Delivery slug: `2026-02-03-1000-food-static-pickups`.
