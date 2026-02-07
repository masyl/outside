---
title: 'Pointer System — In-Game Pointer and Pointable Roadmap'
delivery_date: '2026-02-03'
status: 'in_progress'
type: 'roadmap'
related_documents:
  - './pitch.md'
  - './plan.md'
---

## Pointer System Roadmap

This roadmap tracks the **todos** and **success criteria** for adding pointer and viewport state to the **simulation (ECS)** and consuming them in Storybook.

Refer to the [Plan](./plan.md) and [Pitch](./pitch.md) for details.

## Workstreams

- **W1: Simulator ECS** (PointerTarget, View, IsViewportFocus, View entity, Pointer entity/state)
- **W2: Simulator API** (setPointerTile, getPointerTile, resolveEntityAt, get/setViewportFollowTarget)
- **W3: Storybook** (read from sim, write input into sim, pointer visual, viewport follow, demo clicks)

## Agent workflow

1. Complete one todo.
2. Run tests / Storybook and verify.
3. Update roadmap.md.
4. Commit. Then repeat.

## Milestones / Todos

### Phase 0: Simulator — PointerTarget and viewport (ECS)

- [x] PointerTarget tag, IsViewportFocus + View, View entity at world creation; PointerTarget on floor, wall, bot prefabs.

### Phase 1: Simulator — Pointer state (ECS)

- [x] Pointer entity (or world pointer state), setPointerTile, getPointerTile.

### Phase 2: Simulator — Resolve and viewport API

- [x] resolveEntityAt(world, x, y); getViewportFollowTarget, setViewportFollowTarget.

### Phase 3: Storybook — Consume simulation state

- [x] Read pointer and viewport from simulation; setPointerTile on move; pointer visual and viewport center from sim; demo clicks mutate simulation.

### Phase 4: Storybook — Event wiring

- [x] Viewport/pointer events; viewCenter from getViewportFollowTarget + Position.
