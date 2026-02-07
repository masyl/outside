---
Title: New Simulation Core in ECS
Category: Core
DeliveryLink: /deliveries/2026-02-01-1200-new-simulation-core-ecs/
---

# New Simulation Core in ECS

## Motivation

The current game simulation has reached the limit of what the initial proof of concept should try to achieve and is not well decoupled from other components of the project. A dedicated simulation core in ECS would clarify responsibilities, make new behaviors (autonomy, physics, interactions) easier to add, and align terminology and architecture for future features like inventory, items, and more entity types.

Instead of trying to refactor the existing tangled mess that was generated without clear architectural constraints, a new compact core would allow for a cleaner start on ECS principles.

## Solution

Introduce a new simulation core that runs on an [ECS](https://en.wikipedia.org/wiki/Entity_component_system) architecture in a separate sub-project and gradually re-implement features from the legacy core (current simulation lives in **outside-core**: `world.ts`, `types.ts`).

This new core should be used by the game as a module and prevent tight coupling by using a well defined API.

The following architectural constraints should be respected:

- ECS/Data-Driven: Composition pattern for game mechanics is based on the ECS pattern and the game engine stays close to a data-driven approach that favors performance, unless absolutely needed.
- Headless: The simulator should only concern itself with an abstract simulation without concerns for rendering, loading assets or capturing user inputs.
- Higher level concepts like CQRS, Time travel, persistence or scripting should not be part of this simulation core.
- Instrumented: External tooling can fully observe and control the core engine externally by using a public API.
- Time agnostic: The core does not control how many tics are executed; the parent process controls the rate of simulation.

## Inclusions

- ECS based simulation core.
- A few basic components for position, size (diameter), direction, speed.
- A few basic systems for movement, collision and randomWalk.
- A testing renderer attached to the core, built in react and svg. This renderer should be used in the storybook to feature the new simulation core.
- Simulation tick that runs systems in a defined order (e.g. movement → collision → randomWalk)
- Deterministic behavior and compatibility with existing RNG/seed usage (RNG lives in **outside-core** `utils/random.ts`).
- A clean API to spawn entities, move time forward (tics), read the world state, receive events (collisions).
- Clear boundary: simulation core lives in new package `outside-simulator`.

## Exclusions

- Exclude: Full migration of all game logic in one go — We start with the minimum specified and more will be added during implementation depending on progress.
- Exclude: Network protocol changes — ECS state can be serialized for sync in a follow-on pitch.
- Exclude: New game features (inventory, items, new entity types) — enabled by this pitch but not part of it.
- Exclude: Grid system (not in this pitch).
- Exclude: Connecting this core to the current game — keep it isolated for now.

## Implementation Details

- Use the [bitecs](https://github.com/NateTheGreatt/bitECS) npm package.
- Annotate the code using TSDoc.
- The new sub-project should be called `outside-simulator`.
- For the ticks, use the same "time to ticks" conversion from the existing game when calculating distance moved during a tick.

## Prerequisites

- None

## Suggested follow ups

- Bringing back the current game mechanics as ECS elements.
- A new renderer decoupled from the simulation core.

## Review Questions

- Q: Should this pitch mean full migration of current game logic into the new core, or new ECS core plus a defined subset of mechanics? If subset, which mechanics are in scope?
  - A: New ECS core + minimum subset (position, movement, collision, randomWalk); more added during implementation depending on progress.

- Q: RNG compatibility: same algorithm, same public API (seed + next), or both? Should the new core call outside-core’s RNG or reimplement the same contract?
  - A: Move the RNG into a proper utility module that can be imported alone. Unsure if "core" is the appropriate sub project.

- Q: Component/system list: leave “a few basic” as-is for the plan, or lock the list?
  - A: Focus on the list: components position, size (diameter), direction, speed; systems movement, collision, randomWalk.

- Q: Demo app location: new package under repo (inside or next to outside-simulator), or reuse existing client? How is it run?
  - A: Add this test renderer into the Storybook documentation, in order to enable testing the new simulation core visible.

- Q: Is system order “movement → collision → randomWalk” fixed, or can the plan propose a different order?
  - A: Try this order first. The rationale is that collision detection should be done after movement and then react accordingly (e.g. apply damage, bounce the entity, or emit a sound effect event). The collision system cannot simply guess the result of the movement system in advance without running it.

- Q: Confirm outside-simulator is a new package in the existing pnpm workspace (outside-*), same tooling as other packages.
  - A: Yes; new package outside-simulator in monorepo, same build/test/lint as other packages. But this module is passive and does not need to be "started", since it is simply loaded and used by other projects.

- Q: Any requirement for tests in this pitch (unit tests for systems, determinism tests, API tests), or assume same as rest of repo?
  - A: Same as rest of repo (e.g. 80%+ coverage, unit tests) and also include determinism tests (same seed + tics ⇒ same state) and API tests for the public surface.

- Q: Determinism: same seed + tic count ⇒ identical world state (and event stream), or looser “reproducible under same conditions”?
  - A: Looser: meaning the new core does not need to match the legacy POC, but the new core itself is deterministic.

- Q: How does a "tic" relate to the legacy time model (timeMs, dtMs)? The Implementation Detail says use the same "time to ticks" conversion when calculating distance moved during a tick — does each tic carry a delta-time (ms) for movement, or is one tic a fixed time unit?
  - A: One tic = fixed uniform time unit (e.g. 50 ms); The simulator is configured by the parent process. No delta-time per tic; movement uses fixed step. Movement calculations should be made with utilities that are shared.

- Q: Are world bounds (horizontal/vertical limits, e.g. -limit..+limit like legacy outside-core) in scope for outside-simulator?
  - A: No; bounds are out of scope for this pitch; plan assumes unbounded. We will implement bounds in a follow-up delivery.

- Q: Collision scope: does the collision system only detect overlap and emit events, or also perform response (bounce, damage, block movement)?
  - A: Detection + events only; no built-in response. Consumers (or a separate system in a follow-up) handle response. In the test rendered, simply change the entity color when a collision is detected.

- Q: RNG "proper utility module that can be imported alone" — new package (e.g. outside-utils) or keep in outside-core as utils/random and have outside-simulator depend on outside-core for RNG?
  - A: New shared package (e.g. outside-utils) with RNG utilities and other utilities that will be created during implementation; both outside-core and outside-simulator depend on it.

- Q: How does the game "receive events (collisions)" — callback, observable/subscription, or pull (e.g. dequeue after tick)?
  - A: To make sure the ECS loop cannot be interupted mid-loop, the simulation should simply log all events into a common queue which can be queried by the parent process. This will also allow the implementation of a publish/subscribe pattern between ticks that relies on that queue.
