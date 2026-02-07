---
Title: "Pointer System — In-Game Pointer and Pointable"
DeliveryDate: 2026-02-03
Summary: Pointer and viewport state in the simulation (ECS); Storybook and any renderer consume and push input.
Status: TODO
Branch: feature/pointer-system
Commit: ""
---

# Pointer System — In-Game Pointer and Pointable

Pointer state (current tile, entity under pointer) and viewport state (which entity is followed) are **simulation/ECS concepts** in outside-simulator. Renderers (Storybook first) read this state and write input (pointer move, click actions) into the simulation.

## Documents

- [Pitch](./pitch.md)
- [Implementation Plan](./plan.md)
- [Roadmap](./roadmap.md)
