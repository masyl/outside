# New Simulation Core in ECS

Delivery: headless ECS simulator (`outside-simulator`), shared utils (`outside-utils`), and Storybook test renderer.

- **Pitch**: [pitch.md](./pitch.md)
- **Plan**: [plan.md](./plan.md)

## Summary

- **outside-utils**: RNG (Random) and movement/time utilities (distancePerTic, stepPosition); used by outside-core and outside-simulator.
- **outside-core**: Now depends on @outside/utils for RNG; re-exports Random.
- **outside-simulator**: bitecs-based ECS with components (position, size, direction, speed), systems (movement, collision, randomWalk), event queue API, and public API (createWorld, addSimEntity, runTics, getWorldState, drainEventQueue, etc.).
- **Storybook**: Simulator/ECS Core story with React + SVG renderer; entities move and collide; red highlight on collision.

## Run

- Build all: `pnpm build`
- Test all: `pnpm test`
- Storybook (simulator story): `pnpm --filter outside-storybook storybook` then open Simulator/ECS Core
