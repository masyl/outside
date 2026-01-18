# Timeline Engine Core (Timeline series: 2)

## Motivation

The game currently records all state changes as events but lacks the ability to navigate through time. To support timeline controls for development, debugging, and level design, we need a core engine that can manage event history, support navigation to any point in time, and maintain performance with large event counts.

## Solution

Build a Timeline Manager that extends the existing event-sourced architecture to support time navigation. The engine will add a virtual "pointer in time" that can move through event history without deleting events, cache the end state before navigation for quick recovery, and enforce a 10,000 step limit with collapse logic. All events will be enhanced with original value data to enable efficient backward navigation.

## Inclusions

- Timeline state manager class with pointer, mode (normal/timeline), and history management
- Event data enhancement: add `originalValue` field to all logged events for efficient backward navigation
- End state caching: store current WorldState before timeline navigation begins
- Timeline navigation methods:
  - `goToStep(stepNumber)`: Move pointer to specific step
  - `stepForward()`: Move one step forward
  - `stepBackward()`: Move one step backward
  - `goToStart()`: Jump to beginning of history
  - `goToEnd()`: Jump to end of history
- State reconstruction: rebuild WorldState at any step using enhanced events
- History truncation: remove all events after current pointer when new action is taken from past
- 10,000 step limit enforcement
- Event collapse logic: combine 480-step blocks when limit reached
- EventLogger enhancements for timeline support
- Integration with existing Store for state updates

## Exclusions

- UI components (timeline bar, status indicators) - covered in Timeline UI Components
- Keystroke handlers - covered in Timeline Keystrokes Integration
- Network synchronization - covered in Timeline Network Synchronization
- Playback controls integration - covered in Playback Controls & Game Loop Integration

## Implementation Details

Create `TimelineManager` class in `outside-client/src/timeline/manager.ts` that wraps the Store and EventLogger. The manager will track the current "pointer in time" (step number) and provide navigation methods. EventLogger will be extended to store `originalValue` for each event (e.g., for MOVE_OBJECT events, store previous position). State reconstruction will process events up to the target step, using `originalValue` for backward steps to avoid replaying entire history.

The 10,000 step limit will be enforced by checking `events.length` before adding new events. When the limit is reached, the oldest 480 events will be collapsed into a single state change event representing the net effect of those events.

## Related Pitches

- **Prerequisite**: [Keystroke Help Menu (Timeline series: 1)](../../pitches/keystroke-help-menu.md)
- **Next**: [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
- **Depends on**: EventLogger, Store, CommandHandler

## Prerequisites

- Keystroke Help Menu (Timeline series: 1) - establishes modifier key pattern

## Next Logical Pitches

- [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
- [Timeline UI Components (Timeline series: 4)](../../pitches/timeline-ui-components.md)
- [Timeline Keystrokes Integration (Timeline series: 5)](../../pitches/timeline-keystrokes-integration.md)
- [Timeline Network Synchronization (Timeline series: 6)](../../pitches/timeline-network-synchronization.md)

## Open Questions

- Should event collapse be implemented immediately or deferred to a future pitch? (Currently included)
- Performance: What's the acceptable reconstruction time for states at 10,000 steps? (No benchmark yet)

## Timeline Series Context

This is the core engine that all other timeline features depend on. It provides the fundamental ability to navigate time, which will be exposed through UI components, keystrokes, and eventually synchronized across the network.
