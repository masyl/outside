# New Simulation Core in ECS

## Motivation

The current game simulation is not well decoupled from other components of the project and is at the limit of what the initial proof of concept should try to achieve. A dedicated simulation core in ECS would clarify responsibilities, make new behaviors (autonomy, physics, interactions) easier to add, and align terminology and architecture for future features like inventory, items, and more entity types.

Instead of trying to refactor the existing tangled mess that was generated without clear architectural constraints, a new compact core would allow for a cleaner start on ECS principles.

## Solution

Introduce a new simulation core that runs on an ECS architecture in a separate sub-project and gradually re-implement features from the legacy core.

This new core should be used by the game as a module and prevent tight coupling by using a well defined API.

The following architectural constraints should be respected:

- ECS/Data-Driven: Composition pattern for game mechanics is based on the ECS pattern and the game engine stays close to a data driven approach that favors performance. Unless absolutely needed.
- Headless: The simulator should only concern itself with an abstract simulation without concerns for rendering, loading assets or capturing user inputs.
- Higher level concepts like CQRS, Time travel, persistence or scripting should not be part of this simulation core.
- Instrumented: External tooling can fully observe and control the core engine externally by using a public API.
- Time agnostic: The core does not control how many tics are executed. The parent process is the one controlling the rate of simulation.

## Inclusions

- ECS core: Use the `bitecs` npm package (NateTheGreatt/bitECS) for all ECS-related mechanics.
- A few basic components for position, size (diameter), direction, speed.
- A few basic systems for movement, collision and randomWalk.
- A thin demo app with a simple rendering loop using basic geometric shapes with PixiJS (simulator itself remains headless).
- Simulation tick that runs systems in a defined order (e.g. movement → collision → randomWalk)
- Deterministic behavior and compatibility with existing RNG/seed usage
- A clean API to spawn entities, move time forward (ticks), read the world state, receive events (collisions).
- Clear boundary: simulation core lives in new package `outside-simulator`.

## Exclusions

- Exclude: Full migration of all game logic in one go (in or out of scope depending on plan).
- Exclude: Network protocol changes — ECS state can be serialized for sync in a follow-on pitch.
- Exclude: New game features (inventory, items, new entity types) — enabled by this pitch but not part of it.
- Exclude: Grid system (not in this pitch).
- Exclude: Connecting this core to the current game — keep it isolated for now.

## Implementation Details

- Use the `bitecs` npm package (NateTheGreatt/bitECS).
- Annotate the code using TSDoc.
- The new sub-project should be called `outside-simulator`.

## Prerequisites

- None

## Suggested follow ups

- Bringing back the current game mechanics as ECS elements.
- A new renderer decoupled from the simulation core.

## Open Questions

- None
