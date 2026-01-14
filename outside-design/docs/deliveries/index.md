# Deliveries

This section contains plans that have been completed and implemented. Each plan document reflects the actual work that was done, including a work summary, implementation details, and references to the commits where the work was completed.

## What are Deliveries?

Deliveries are completed implementation plans that have been archived in the design documentation. They serve as:

- **Historical Record**: Documentation of what was built and how
- **Reference Material**: Examples of implementation approaches and decisions
- **Learning Resource**: Insights into the development process and outcomes

Each delivery includes:

- **Work Summary**: High-level overview of what was accomplished
- **Implementation Details**: The actual work that was done (updated from the original plan)
- **Commit Reference**: Link to the GitHub commit where the work was completed
- **Date & Time**: When the plan was completed

## Process

When a plan is completed, it goes through a "wrapup" process:

1. The plan is updated to reflect the actual work done (not just the original plan)
2. A work summary is added as the first section
3. A commit reference and GitHub link are added
4. The plan is saved with a descriptive filename and date/time prefix
5. The plan is added to this index with dates and descriptions

**Note**: The wrapup process is only initiated when explicitly requested. Plans are not automatically wrapped up.

---

## Completed Deliveries

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
