
---

## Ongoing Deliveries

### Adding Storybook to the project for component testing (2026-01-15)

This implementation plan details() step-by-step approach to add Storybook as a separate workspace package in the monorepo. The key architectural decision is to use commands for all state manipulation, including world size configuration, following the existing game's command-driven architecture.

[Delivery →](./2026-01-15-storybook-implementation/plan.md)

## Completed Deliveries

### [Timeline Keystrokes Integration (2026-01-18)](./2026-01-16-1000-timeline-keystrokes-integration/README.md)

Implemented complete keyboard interface for timeline controls with Mac compatibility. All timeline keystrokes (Alt+Space, Alt+Arrows, Alt+Home/End) working in host mode. Added debug panel enhancements, bot creation improvements, and LevelStart tagging system. All 139 tests passing. Completes local/host mode timeline experience with polished UI and cross-platform modifier key support.

### [Timeline Playback Controls (2026-01-17)](./2026-01-16-1000-timeline-playback-controls/README.md)

Implemented core playback controls (pause, resume, step) and game loop integration. Introduced synchronized `PlaybackState` management (PLAYING, PAUSED, TRAVELING) across the system. Ensures bot autonomy and event queues are handled correctly during time travel, preventing state corruption. Stabilized test infrastructure and build pipeline.

### [Timeline Engine Core Unit Testing (2025-01-17 21:36)](./2025-01-17-1500-timeline-engine-core-unit-testing/plan.md)

Successfully implemented comprehensive unit testing for Timeline Engine Core with 92%+ test coverage across all timeline components. Created 65 test cases covering TimelineManager, EventLogger timeline features, and integration testing. Fixed critical implementation issues including state reconstruction from fresh state and store reducer integration. Timeline Engine Core is now production-ready with robust test foundation for all subsequent timeline features.

### Keystroke Help Menu (Timeline series: 1) (2026-01-16 14:30)

Implemented DOM-based help overlay displaying all available keyboard shortcuts. All planned functionality was completed including KeystrokeOverlay class with table format display, keyboard integration with "?" and ESC keys, comprehensive keystroke documentation, and styling matching debug aesthetic. The overlay provides accessible keyboard shortcut reference and establishes the modifier key pattern (Option/Alt) that will be used throughout the timeline controls series.

[Delivery →](./2026-01-16-1430-keystroke-help-menu/plan.md)

### Basic Unit Testing Setup (2026-01-15)

Implemented comprehensive unit testing infrastructure across all workspace packages with code coverage reporting and TypeScript support. Achieved 100% statement coverage for core package and 97.95% branch coverage focusing on all conditional paths.

[Delivery →](./2026-01-14-2258-basic-unit-testing-setup/plan.md)

### 2026-01-09 12:30 - Pixel Art Visuals

Replaced geometric placeholders with pixel art assets. Implemented asynchronous sprite sheet loading and rendering for terrain (grass, water) and bots. Includes tiling support for terrain and automatic placeholder-to-sprite upgrading.

[View full plan →](./2026-01-09-1230-pixel-art-visuals.md)

### 2026-01-09 10:45 - Bot Autonomy

Implemented seeded, autonomous movement for bots. Bots now randomly explore the map (or wait) based on a deterministic random number generator. The master seed is persisted in the world state, ensuring consistent behavior across reloads. Also includes fixes for legacy save states and console log cleanup.

[View full plan →](./2026-01-09-1045-bot-autonomy.md)

### 2026-01-09 10:20 - Client Reconnection Stability

Implemented a progressive reconnection system for clients. Features a smart backoff strategy (silent retry after 1s, visible warning after 2s, then 5s loop) to handle network interruptions gracefully. Includes a new `ConnectionOverlay` UI component to keep users informed during outages.

[View full plan →](./2026-01-09-1020-client-reconnection.md)

### 2026-01-09 10:05 - Debug Overlay Object Counts

Updated the Debug Overlay to display separate counts for Surface objects (bots) and Ground objects (terrain). Resolved an issue where object counts were inaccurate. The overlay now displays `Objects: X (Surf) / Y (Gnd)`.

[View full plan →](./2026-01-09-1005-debug-overlay-counts.md)

### 2026-01-09 10:00 - P2P Status in Debug Overlay

Implemented a real-time P2P connection status indicator in the debug overlay. Exposed WebRTC connection state changes from the low-level peer connection up to the UI through a callback chain. Works for both Host and Client modes, providing immediate visibility into connection health (connected, disconnected, failed).

[View full plan →](./2026-01-09-1000-p2p-status-debug-overlay.md)

### 2026-01-08 21:12 - Layered Grid Implementation

Implemented complete two-layer grid system with ground layer (terrain) and surface layer (bots/objects). Terrain objects can span multiple tiles, stack on top of each other, and determine walkability. Added 5 terrain types (grass, dirt, water, sand, holes) with color-coded rendering. Walkability system prevents bots from moving to or being placed on non-walkable terrain. Initial terrain loading processes all terrain commands synchronously before game loop starts. Visual improvements: bot sprites changed to circles, selected bot has white fill with blue outline, unselected bots have grey border, and each grid tile has 4x4 checkered pattern inside.

[View full plan →](./2026-01-08-2112-layered-grid-implementation.md)

### 2026-01-08 15:29 - Player Input and Game Loop Optimization

Implemented complete player input system with bot selection and keyboard controls. Added SelectionManager and KeyboardHandler for Tab/Shift+Tab cycling and arrow key movement. Renderer updated to show selected bot in green, others in white. Game loop optimized from 500ms to 125ms for 4x faster command processing. Animation duration synchronized with new game loop speed.

[View full plan →](./2026-01-08-1529-player-input-and-game-loop-optimization.md)

### 2026-01-08 14:57 - Smooth Animations

Implemented smooth bot movement animations with pixel-based interpolation. Animation system operates independently from the 500ms command loop, using manual `requestAnimationFrame` with cubic easing. Renderer updated to preserve sprites during state updates.

[View full plan →](./2026-01-08-1457-smooth-animations.md)

### 2026-01-08 14:57 - Game Client POC

Built the first POC for the game client with complete CQRS/Flux architecture. Includes Pixi.js rendering, command system, 500ms game loop, and mock command feeder. All core systems implemented and working.

[View full plan →](./2026-01-08-1457-game-client-poc.md)

### 2026-01-08 14:28 - Debug Overlay and Animation Infrastructure

Added debug overlay with FPS counter, step counter, and version tracking. Implemented sprite index system in renderer and AnimationController for smooth animations. Infrastructure ready for animation system.

[View full plan →](./2026-01-08-1428-debug-overlay-and-animation-infrastructure.md)

---

Plans are listed in reverse chronological order (most recent first) with:

- Date and time of completion
- Brief description
- Link to the full plan document
