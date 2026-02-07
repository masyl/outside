# Connection Modes

## Motivation

The app currently uses a "first come, first served" mechanic for choosing "Client" or "Host" modes. Meaning that the first client to connect to the signaling server becomes the host. This causes the connected sessions to switch roles unexpectedly during development and makes it difficult to have a smooth testing experience.

## Solution

We will introduce explicit "Connection Modes" to strictly define the application's behavior.

- **Modes**:
  - **LOCAL**: The default mode. Does not initiate any connection to a signaling server. Starts playing immediately without waiting for clients.
  - **HOST**: Connects to the signaling server and waits for/allows clients to connect.
  - **CLIENT**: Tries to connect to the currently running host and then flushes the current game state once it connects to the HOST.

- **Controls**:
  - `Alt+H`: Switch to **HOST** mode.
  - `Alt+C`: Switch to **CLIENT** mode.
  - `Alt+L`: Switch to **LOCAL** mode (implied for reversibility).

- **Persistence**:
  - The app will remember the selected mode between reloads (using `localStorage`).

- **Behavior**:
  - Switching modes will trigger a page reload to ensure a clean state initialization with the new mode.

## Inclusions

- Update `init` logic in `packages/outside-client/src/main.ts` to read mode from `localStorage`.
- Implement `Alt+H`, `Alt+C`, and `Alt+L` global keystrokes.
- Persist mode selection to `localStorage`.
- Ensure LOCAL mode bypasses signaling entirely.
- Ensure HOST mode registers as host.
- Ensure CLIENT mode registers as client.

## Exclusions

- Visual UI for mode selection (keystrokes only).

## Implementation Details

- Modify `initializeGame` in `packages/outside-client/src/main.ts`.
- Add event listeners for the new keystrokes.
- Use `localStorage.setItem('connectionMode', mode)` and `localStorage.getItem('connectionMode')`.
