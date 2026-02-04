---
title: 'Food in the Dungeon — Static Pickups Roadmap'
delivery_date: '2026-02-03'
status: 'planning'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Food in the Dungeon — Static Pickups Roadmap

This roadmap tracks the **todos** and **success criteria** for adding static food pickups: food entities on the floor, consumption when a bot overlaps food, and Storybook rendering.

Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Data model** (Food component, spawnFood prefab)
- **W2: Consumption** (ConsumedEvent, consumption system, pipeline order)
- **W3: Storybook** (render food, demo layout with food)
- **W4: Tests** (unit tests, determinism if needed)
- **W5: Docs** (TSDoc, exports)

## Agent workflow

1. Complete one todo.
2. Write tests and pass.
3. Update roadmap.md.
4. Commit. Then repeat.

## Milestones / Todos

### Phase 0: Food component and prefab

- [x] Add Food tag component; register in components index and codegen.
- [x] Add spawnFood(world, { x, y }) prefab; export from simulator.

### Phase 1: Consumed event and consumption system

- [x] Add ConsumedEvent type and consumptionSystem; insert in pipeline after movement.

### Phase 2: Storybook — render food

- [x] Query and draw food entities with distinct visual (color/icon).

### Phase 3: Storybook — demo layout with food

- [x] Spawn food in at least one demo; verify consumption and visual removal.
