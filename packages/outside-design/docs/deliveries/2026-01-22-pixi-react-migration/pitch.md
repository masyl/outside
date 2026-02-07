# PixiJS React Migration

## Motivation

The application is currently built with a mix of imperative PixiJS code (`GameRenderer`) and direct DOM manipulation (`DebugOverlay`). As the application grows, this makes state management and UI composition difficult.

By introducing **React** and **@pixi/react**, we can:

1.  Structure the application as reusable components.
2.  Manage state declaratively.
3.  Unify the rendering pipeline (everything in Pixi, including UI).

## Solution

We will introduce `react`, `react-dom`, and `@pixi/react` to the project. The migration will happen in stages, starting with the core level rendering and moving to UI components.

## Migration Steps

1.  **Infrastructure**: Install dependencies and setup the React root.
2.  **Level Rendering**: Refactor `GameRenderer.ts` into React components (`<World>`, `<Grid>`, `<Terrain>`, `<Entities>`).
3.  **Debug Panel**: Convert the HTML-based `DebugOverlay` to a Pixi-based React component.
4.  **Keystroke Help**: Convert the HTML overlay to a Pixi-based React component.
5.  **Timeline**: Convert the `TimelineBar` (imperative Pixi) to a declarative React component.

## Technical Considerations

- **PixiJS v8 Compatibility**: We must ensure `@pixi/react` is compatible with the installed `pixi.js` v8. This might require using the beta/rc version of `@pixi/react` (v8.0.0).
- **Performance**: We will use efficient React patterns (refs for mutable instances, minimizing re-renders) to ensure game loop performance is not degraded.
- **State Management**: We will continue using the existing `Store` but connect it to React components (likely via `useSyncExternalStore` or similar pattern).

## Inclusions

- New dependencies: `react`, `react-dom`, `@pixi/react`.
- Refactoring `main.ts` to boot React.
- Refactoring `renderer.ts` and overlays.

## Exclusions

- Changes to the core game logic (simulation, physics, networking). This is a view-layer refactor only.
