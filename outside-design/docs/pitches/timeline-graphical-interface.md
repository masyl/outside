---
Title: Timeline Graphical Interface
Category: Timeline
Status: draft
---

# Timeline Graphical Interface

## Motivation

The timeline and game loop need a visible, user-facing interface: a display of current time (hours, minutes, seconds) and controls (e.g. play, pause, step) so users and developers can see and control playback. Without a graphical timeline UI, time and controls are opaque or only available via keyboard shortcuts.

## Solution

Add a **graphical timeline interface** that shows the current time in a readable format (e.g. hours, minutes, seconds) and provides **command buttons** (e.g. play, pause, step forward) wired to the existing timeline or game loop API. The UI can be an overlay, a panel, or integrated into the client/Storybook; the exact layout is flexible.

## Inclusions

- **Time display**: show current game/timeline time in hours, minutes, and seconds (format and update rate to be defined).
- **Command buttons**: at least play, pause, and step (or equivalent) connected to the existing playback/timeline API.
- Integration with the **existing timeline or game loop** (e.g. TimelineManager, host mode) so the UI reflects and controls real state.
- Accessible placement (e.g. corner, bar, or panel) so it does not obscure the main view unnecessarily.

## Exclusions

- No full redesign of the timeline or replay system.
- No new timeline data structures or persistence in this pitch; only the UI surface.
- No mandatory change to how the simulator is driven (e.g. tic rate); the UI controls when the client advances time.

## Pre-requisites

- Existing timeline or game loop with play/pause/step (or equivalent) API.
- Client or Storybook context where the UI can be rendered.

## Open Questions

- Should the time display show wall-clock time, simulation time, or both?
- Where should the timeline UI live (client only, Storybook only, or shared)?

## Next Logical Pitches

- Timeline scrubbing or seek-to-time.
- Multiple timelines or layers.
- Save/load timeline state.

## Implementation Details (use sparingly)

- Client- or Storybook-only: the UI calls the existing TimelineManager or game loop methods (e.g. pause, step). The simulation core (outside-simulator) remains tic-based and is driven by the client; when paused, the client simply does not call `runTics`. No ECS changes required for the UI itself.
