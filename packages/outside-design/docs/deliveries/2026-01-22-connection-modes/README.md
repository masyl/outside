---
Title: Connection Modes
DeliveryDate: 2026-01-22
Summary: Implements explicit LOCAL, HOST, and CLIENT connection modes with keyboard shortcuts and persistence to improve testing and development workflows.
Status: DONE
Branch: feature/connection-modes
---

# Connection Modes

## Overview

This delivery replaces the implicit "first-come, first-served" hosting logic with explicit connection modes. This change prevents unexpected role switching during development and provides a stable testing environment.

## Features

- **Three Explicit Modes**:
  - **LOCAL** (Default): Offline mode. Starts the game immediately without signaling.
  - **HOST**: Connects to signaling server and waits for clients.
  - **CLIENT**: Connects to signaling server and looks for a host.
- **Keyboard Shortcuts** (Global):
  - `Alt+H`: Switch to **HOST** mode.
  - `Alt+C`: Switch to **CLIENT** mode.
  - `Alt+L`: Switch to **LOCAL** mode.
- **Persistence**: Mode selection is saved in `localStorage` and preserved across page reloads.
- **Debug Info**: Current mode is displayed in the debug overlay.

## Technical Details

- Modified `packages/outside-client/src/main.ts` to handle mode initialization and switching.
- Updated `initializeGame` logic to strictly respect the selected mode.
- Added `setMode` to `DebugOverlay` to visualize the current state (including 'LOCAL').

## Verification

- **Automated Tests**: All unit tests passed (see [Testing Report](./testing.md)).
- **Manual Testing**: Verified mode switching, persistence, and signaling behavior for each mode.
