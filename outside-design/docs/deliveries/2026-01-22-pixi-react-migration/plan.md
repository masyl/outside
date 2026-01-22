# Implementation Plan - PixiJS React Migration

## 1. Setup & Dependencies ✅

- [x] Install `react` (v19), `react-dom`, `@pixi/react` (v8).
- [x] Install types: `@types/react`, `@types/react-dom`.
- [x] Verify `vite.config.ts` handles JSX/React correctly (it does).
- [x] Create `src/components/` directory.

## 2. Infrastructure ✅

- [x] Create `GameRoot.tsx`: The main entry point component.
- [x] Refactor `main.ts`:
  - Initialize `Store`, `SignalingClient`, etc.
  - Render `GameRoot` into the DOM.
  - Pass core services (`store`, `timelineManager`) as props.
- [x] Enable JSX in `tsconfig.json`.

## 3. Level Rendering Migration ✅

- [x] Create `pixi-setup.ts`: Extend PixiJS types for React compatibility.
- [x] Create `LevelViewport.tsx`: Wrapper that instantiates imperative `GameRenderer`.
- [x] **Strategy Decision**: Keep `GameRenderer` imperative inside `LevelViewport` for performance.
  - The rendering loop runs outside React's render cycle.
  - React only handles the app container initialization.
- [x] Removed: `Stage.tsx`, `WorldRenderer.tsx` (not needed with this approach).

## 4. Debug Panel Migration ✅

- [x] Create `DebugPanel.tsx`.
- [x] Create `debugStore.ts`: React state management for debug data.
- [x] Create `debugBridge.ts`: Static interface between imperative code and React store.
- [x] Use Pixi `<graphics>` and `<pixiText>` components to render stats.
- [x] Position it fixed relative to the screen (using `app.screen` dimensions).
- [x] Remove `DebugOverlay.ts` (HTML version).

## 5. Keystroke Help Migration ✅

- [x] Create `KeystrokeHelp.tsx`.
- [x] Create `keystrokeStore.ts`: React state for keystroke help visibility.
- [x] Create `keystrokeBridge.ts`: Static interface for toggling.
- [x] Implement using Pixi UI components.
- [x] Remove `KeystrokeOverlay.ts`.

## 6. Timeline Migration ✅

- [x] Create `Timeline.tsx`.
- [x] Re-implement `TimelineBar` logic using React state and Pixi graphics.
- [x] Fix Timeline integration: Pass `timelineManager` prop from `main.ts` to `GameRoot` to `Timeline`.
- [x] Remove `TimelineBar.ts`.

## Verification

- [x] All tests passing (151 tests).
- [x] Build successful (TypeScript compiles without errors).
- [ ] Verify game renders correctly (grid, terrain, bots).
- [ ] Verify animations work (bots walking).
- [ ] Verify camera follows selection.
- [ ] Verify debug panel shows correct stats.
- [ ] Verify performance (FPS) is comparable to before.

## Additional Fixes

- [x] Fixed React version mismatch (v18 -> v19).
- [x] Fixed `@pixi/react` intrinsic element errors.
- [x] Fixed `GameRoot` initialization (using `useApplication` hook).
- [x] Fixed console spam in `visualDebugLayer.ts` and `debugBridge.ts`.
- [x] Added guard in `BotAutonomy.decideAction` to prevent crashes when bots lack positions.
