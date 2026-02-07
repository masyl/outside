# Implementation Plan - Connection Modes

## Goal

Replace implicit host/client selection with explicit LOCAL, HOST, and CLIENT modes, controllable via keystrokes and persisted across reloads.

## Proposed Changes

### `packages/outside-client/src/main.ts`

1.  **Type Definition**: Define a `ConnectionMode` type (`'local' | 'host' | 'client'`).
2.  **Persistence**:
    - In `init()`, check `localStorage.getItem('outside-connection-mode')`.
    - Default to `'local'` if not set.
    - Use this persisted value to override the default `'auto'` behavior or pass it to `initializeGame`.
3.  **Mode Switching Logic**:
    - Add a global keydown listener (or use `KeyboardHandler` if appropriate, but global might be safer for app-level switching).
    - **Alt+H**: Set storage to `'host'` -> `window.location.reload()`.
    - **Alt+C**: Set storage to `'client'` -> `window.location.reload()`.
    - **Alt+L**: Set storage to `'local'` -> `window.location.reload()`.
4.  **Initialization Logic**:
    - Refactor `initializeGame` to respect the explicit mode strictly.
    - **LOCAL**: Call `initializeHostMode({ local: true })`.
    - **HOST**: Call `signalingClient.registerHost()` then `initializeHostMode()`.
    - **CLIENT**: Call `initializeClientMode()`.

## Verification Plan

1.  **Default Behavior**: Clear local storage, load app. Verify it starts in LOCAL mode (no signaling logs).
2.  **Host Switch**: Press `Alt+H`. Verify reload + "Forcing host mode" logs + signaling connection.
3.  **Client Switch**: Press `Alt+C`. Verify reload + "Forcing client mode" logs.
4.  **Local Switch**: Press `Alt+L`. Verify reload + return to LOCAL mode.
5.  **Persistence**: Reload page manually. Verify mode is remembered.
