---
Title: "Food in the Dungeon — Static Pickups"
DeliveryDate: 2026-02-03
Summary: Static food pickups on the floor; bots consume on overlap and a consumed event fires. No hunger or seeking.
Status: DONE
Branch: feature/food-static-pickups
Commit: 126d507
---

# Food in the Dungeon — Static Pickups

Completion: 2026-02-03  
Branch: feature/food-static-pickups  
Tag: delivery/2026-02-03-1000-food-static-pickups

Static food entities on floor tiles: when a bot overlaps food, the food is removed and a consumed event is emitted. No hunger or seeking in this delivery.

## Summary

- **Food component** and spawnFood(world, { x, y }) prefab.
- **ConsumedEvent** and consumptionSystem; pipeline: urge → movement → consumption → obstacleCollision → collision.
- **Storybook**: green food circles; FloorGridDungeonWithFood demo.

## Documents

- [Pitch](./pitch.md)
- [Plan](./plan.md)
- [Roadmap](./roadmap.md)
- [Delivery Report](./delivered.md)
- [Testing Report](./testing.md)
- [Commit Preparation](./commit.md)
