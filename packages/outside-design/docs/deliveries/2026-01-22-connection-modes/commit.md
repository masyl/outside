feat: explicit connection modes (local, host, client)

- Introduce explicit `ConnectionMode` ('local', 'host', 'client') to replace implicit auto-detection.
- Default mode is now `local` (offline, no signaling).
- Add global keyboard shortcuts to switch modes and persist selection across reloads:
  - `Alt+H`: Switch to HOST mode (connects to signaling, waits for clients).
  - `Alt+C`: Switch to CLIENT mode (connects to signaling, finds host).
  - `Alt+L`: Switch to LOCAL mode (offline).
- Persist mode in `localStorage` ('outside-connection-mode').
- Refactor `initializeGame` in `main.ts` to strictly follow the selected mode.
