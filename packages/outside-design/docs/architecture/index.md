# Software Architecture

## Latest Decisions

Recent architectural decisions made for the Outside project. These records capture context, rationale, and implications of major technical choices.

<ADRsList :limit="5" />

## Ongoing Topics

- [Choosing an ECS Library](./choosing-ecs-library.md)
- [Open Source Dependencies](./open-source-dependencies.md)

## Ongoing Goals

### The POC Refactoring

- Headless: A headless world simulation core
- ECS/Data-Driven: Composition pattern for game mechanics is based on the ECS pattern and the game engine stays close to a data driven approach that favors performance.
- Plugins: Ability to load, unload and reload ECS elements (components, systems) and assets using a addon/plugin mechanism.
- Decoupled rendering layer as a reader and input capture.
- CQRS: Decoupled "Command, Record, Sync" module.
- Multi-modal User Input: Abstracted multi-user input layer that allows for mouse, touch, keyboard. Allows for multiple local users for scenarios of Agent participation or local multi-player.
- Instrumented: External tooling can fully observe and control the core engine externally by using an API.
- Scriptable: Run sandboxed scripts built in LUA, Python or JS.

**Other Quality goals:**

- Keep source files short and "single purpose".
- Improve testability of modules with proper decoupling.


### Scripting - Refactoring

- API for the Simulation Core
- Embedding of a script running engine for Lua, Python, Commands
- 

### Declarative - Refactoring

- Dynamic Entity to Asset mapping
- Declarative model for dynamic game assets.
- Game assets that can be shared p2p.
- Declarative model for entities and entity factories (templates).
- Metadata on systems for creative mode.
