# Implementation Plan: Food in the Dungeon — Static Pickups

## Related Files

- **Pitch**: [pitch.md](./pitch.md)

## Overview

Add food entities to the simulator: static pickups on floor tiles with Position and a visual size, a "Food" (or Consumable) tag, and a spawn API. When a bot's collision shape overlaps a food entity, the food is removed and a "consumed" event is emitted. Food is **walk-through** (overlap only, no obstacle). Single food type in this delivery. Storybook renders food with a distinct color/icon so it is visible and disappears when consumed.

## Architectural Principles

1. **Food is walk-through** — Food entities do not have the Obstacle component; overlap triggers consumption only, no movement blocking.
2. **Single food type** — One visual/behavior for this pitch; multiple variants (same behavior) can be a follow-up.
3. **Reuse existing components** — Position, Size (or VisualSize) where applicable; add a tag component (Food/Consumable) for queries and events.
4. **Consumption after movement** — Consumption system runs after movement (same tic as overlap); then obstacle and entity–entity collision. Order: urge → movement → consumption → obstacleCollision → collision.
5. **No hunger, no seeking** — Out of scope: bot stats, seeking behavior, food types, respawn, decay.

---

## 1. Food component and prefab (outside-simulator)

### Checklist

- [x] Add **Food** tag component (e.g. `components/Food.ts`); register in components index and codegen.
- [x] Add prefab **spawnFood(world, { x, y })** (e.g. `prefabs/food.ts`): entity with Position, Size (e.g. diameter 0.5 for overlap), Food. No Obstacle, no Walkable (food is not floor).
- [x] Export spawnFood from simulator index (or prefabs barrel).

---

## 2. Consumed event and consumption system (outside-simulator)

### Checklist

- [x] Add **ConsumedEvent** to `events.ts`: `{ type: 'consumed', entity: number, foodEntity: number, x: number, y: number }` (entity = consumer bot, foodEntity = food eid before removal, x,y = position). Add to SimulatorEvent union.
- [x] Implement **consumptionSystem(world)**: query bots (Position, ObstacleSize, Speed, Direction) and food entities (Position, Size, Food). For each bot, test overlap with each food (circle–circle: bot ObstacleSize.diameter/2, food Size.diameter/2). On overlap: remove food entity (removeEntity), push ConsumedEvent, skip that food for other bots this tic (or process in fixed order and remove immediately).
- [x] Insert consumption system in pipeline after movement, before obstacleCollision: `urge → movement → consumptionSystem → obstacleCollision → collision`.
- [x] Ensure event queue and removeEntity are used correctly (no double-consumption; one bot consumes one food per tic if multiple overlaps).

---

## 3. Storybook: render food

### Checklist

- [x] Query entities with Position + Size + Food; draw each as a distinct shape (e.g. circle or small icon/placeholder) with a distinct color so food is visible and clearly different from bots and floor.
- [x] Render food in the same layer as other entities (above floor/grid); when food is removed, it disappears from the next frame.

---

## 4. Storybook: demo layout with food

### Checklist

- [x] In at least one demo (e.g. dungeon or rect layout), spawn a few food items via spawnFood(world, { x, y }) in rooms or corridors so bots can overlap and consume them; verify consumed events and visual removal.

---

## Master Checklist

- [x] Food component and spawnFood prefab (outside-simulator).
- [x] ConsumedEvent type and consumption system; pipeline order updated.
- [x] Storybook: render food entities (distinct visual).
- [x] Storybook: demo layout with food; verify consumption and events.

---

## Notes

- **Dependencies**: Floor/grid and dungeon-style layouts exist (floor-grid-system delivery). Collision/overlap: reuse circle–circle distance check pattern from collision.ts; food uses Size for overlap radius.
- **Open questions locked**: Food = walk-through (overlap only). Single food type for this pitch.
- **Follow-ups**: Hunger component, food types, respawn (see pitch "Next Logical Pitches").
