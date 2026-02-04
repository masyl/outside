---
Title: "Playback Controls & Game Loop Integration (Timeline series: 3)"
Category: Timeline
DeliveryLink: /deliveries/2026-01-16-1000-timeline-playback-controls/
---

# Playback Controls & Game Loop Integration (Timeline series: 3)

## Motivation

With the Timeline Engine Core in place, we need to integrate timeline navigation with the game loop and playback controls. Users must be able to pause execution, step through events one at a time, and control the playback state (playing/paused/time-traveling). The game loop must respect timeline mode and prevent autonomous bot behavior during navigation.

## Solution

Integrate the Timeline Manager with the GameLoop to support pause/resume, step-by-step execution, and timeline mode transitions. Add playback state management to distinguish between normal play (adding events to history) and timeline navigation (reading from history). Bot autonomy will be paused completely in timeline mode, and no new events will be added to the queue during time travel.

## Inclusions

- GameLoop integration with Timeline Manager:
  - `pause()` method: stop state update loop
  - `resume()` method: resume state update loop
  - `step()` method: execute one step/one event
- Playback state management:
  - Track current state: PLAYING, PAUSED, TRAVELING
  - State transitions with validation
- Bot autonomy control:
  - Pause autonomy in timeline mode (TRAVELING or PAUSED)
  - Only enable autonomy in normal play mode (PLAYING)
- Timeline mode vs normal play mode:
  - Normal play: game loop runs, events added to history, autonomy active
  - Timeline mode: game loop paused, state reconstructed from history, autonomy inactive
- Step-by-step processing:
  - Execute one event per step call
  - Update Timeline pointer
  - Reconstruct state incrementally
- Event queue management:
  - Prevent queue processing in timeline mode
  - Clear queue when entering timeline mode
- HostMode integration:
  - Sync timeline state with Host
  - Manage step counter during playback

## Exclusions

- UI components for playback controls - covered in Timeline UI Components
- Keystroke handlers - covered in Timeline Keystrokes Integration
- Timeline Engine Core - covered in previous deliverable

## Implementation Details

Extend `GameLoop` class with pause/resume/step methods that interact with the Timeline Manager. Create `PlaybackState` enum in `outside-client/src/timeline/playbackState.ts` with values: PLAYING, PAUSED, TRAVELING.

Modify `HostMode` to respect playback state - when in TRAVELING or PAUSED state, the step counter should still increment for tracking purposes but no game logic should execute. Bot autonomy generator should check playback state before generating movement commands.

The step-by-step processing will use `TimelineManager.stepForward()` to advance one event and reconstruct state, then trigger a single frame update in the renderer.

## Related Pitches

- **Prerequisite**: [Timeline Engine Core (Timeline series: 2)](../pitches/timeline-engine-core.md)
- **Next**: [Timeline UI Components (Timeline series: 4)](../pitches/timeline-ui-components.md)
- **Depends on**: GameLoop, HostMode, TimelineManager

## Prerequisites

- Timeline Engine Core (Timeline series: 2) - provides timeline navigation infrastructure

## Next Logical Pitches

- [Timeline UI Components (Timeline series: 4)](../pitches/timeline-ui-components.md)
- [Timeline Keystrokes Integration (Timeline series: 5)](../pitches/timeline-keystrokes-integration.md)
- [Timeline Network Synchronization (Timeline series: 6)](../pitches/timeline-network-synchronization.md)

## Open Questions

- Should step counter continue incrementing during pause for UI tracking? (Answer: Yes)
- Should there be a "slow motion" playback speed? (Not in scope)

## Timeline Series Context

This deliverable connects the timeline engine with the game's execution model. It enables users to actually control playback state and step through time, which will be exposed through UI components and keystrokes in subsequent deliverables.
