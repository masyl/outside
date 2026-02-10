# Open Source Dependencies

This page summarizes the main external libraries used across the project and why they matter.

## Core Runtime Dependencies

### `bitecs`

- **Used in**: `@outside/simulator`, `@outside/renderer`, `@outside/inspector-renderer`
- **Role**: Entity Component System (ECS) foundation for data-oriented simulation and rendering pipelines.
- **Why it matters**: Central to performance and architecture direction for large numbers of entities.

### `pixi.js`

- **Used in**: `@outside/client`, `@outside/renderer`, `outside-storybook`
- **Role**: 2D rendering engine.
- **Why it matters**: Main rendering layer for game visuals, scene updates, and rendering performance.

### `cannon-es`

- **Used in**: `@outside/simulator`, `outside-storybook`
- **Role**: Physics engine integration.
- **Why it matters**: Supports world simulation scenarios requiring rigid-body physics.

### `express` and `ws`

- **Used in**: `@outside/server`
- **Role**: HTTP server (`express`) and WebSocket transport (`ws`).
- **Why it matters**: Backbone for networked server communication and real-time updates.

## UI and Documentation Dependencies

### `react` and `react-dom`

- **Used in**: `@outside/client`, `@outside/inspector-renderer`, `outside-storybook`
- **Role**: UI framework for client-facing and tooling interfaces.
- **Why it matters**: Enables composable UI architecture and Storybook-based component workflows.

### `vitepress` and `vue`

- **Used in**: `@outside/design`
- **Role**: Documentation site generator (`vitepress`) and framework runtime (`vue`).
- **Why it matters**: Powers the docs portal and architecture/process documentation surface.

### `storybook`

- **Used in**: `outside-storybook`
- **Role**: Isolated component development and validation environment.
- **Why it matters**: Supports repeatable UI and renderer scenario testing.

## Key Build and Test Dependencies

### `vite`

- **Used in**: multiple frontend/rendering packages
- **Role**: Build tool and dev server.
- **Why it matters**: Fast development feedback loop and production bundling.

### `vitest`

- **Used in**: core, client, simulator, renderer, utilities, storybook
- **Role**: Unit/integration test runner.
- **Why it matters**: Common test platform across packages with consistent testing workflow.
