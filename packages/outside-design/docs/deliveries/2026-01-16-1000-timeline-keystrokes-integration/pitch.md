# Timeline Keystrokes Integration (Timeline series: 5)

## Motivation

With timeline engine, playback controls, and UI components in place, users need an intuitive way to control timeline features. Keyboard shortcuts provide the most efficient interface for time travel operations, allowing developers to quickly scrub through history, step through events, and control playback state without using the mouse.

## Solution

Add timeline control keystrokes to the KeyboardHandler using the modifier key pattern established in the Keystroke Help Menu. Timeline keystrokes will use Option (Mac) or Alt (Windows) modifier to avoid conflicts with browser shortcuts and existing game controls. All timeline keystrokes will be documented in the keystroke help menu.

## Inclusions

- Timeline keystrokes registration in KeyboardHandler:
  - Option/Alt + Space: Toggle play/pause
  - Option/Alt + Up Arrow: Step forward one event
  - Option/Alt + Down Arrow: Step backward one event
  - Option/Alt + Left Arrow: Scrub timeline backward (multiple steps)
  - Option/Alt + Right Arrow: Scrub timeline forward (multiple steps)
  - Option/Alt + Home: Jump to beginning of history
  - Option/Alt + End: Jump to end of history
- Modifier key detection:
  - Mac: Option key (event.altKey)
  - Windows/Linux: Alt key (event.altKey)
- Keystroke scope:
  - Timeline controls only active in host mode
  - Ignore keystrokes in client mode
  - Prevent conflicts with existing bot movement arrows (no modifier vs with modifier)
- Keystroke Help Menu updates:
  - Add timeline keystrokes to "?" menu
  - Group timeline keystrokes separately
  - Include modifier key instructions
- Event prevention:
  - Prevent default browser behavior for timeline keystrokes
  - Prevent conflicts with existing game shortcuts
- Playback state integration:
  - Timeline keystrokes call appropriate Timeline Manager methods
  - Update playback state and trigger UI updates
- Existing keystrokes with modifier pattern:
  - Map existing debug keystrokes (R, A) to Option/Alt modifier
  - Update keystroke help menu with new modifier requirements

## Exclusions

- Timeline Engine Core - covered in previous deliverable
- UI Components - covered in previous deliverable
- Playback Controls - covered in previous deliverable
- Network synchronization - covered in next deliverable
- Scrub speed adjustment (how many steps per arrow key press) - use sensible default

## Implementation Details

Extend `KeyboardHandler` in `packages/outside-client/src/input/keyboardHandler.ts` to add timeline keystrokes. Each handler will check for the modifier key (event.altKey) before executing timeline actions.

Create helper methods in `KeyboardHandler` for timeline operations:

- `togglePausePlayback()`: Toggle between PLAYING and PAUSED states
- `stepForward()`: Call TimelineManager.stepForward()
- `stepBackward()`: Call TimelineManager.stepBackward()
- `scrubTimeline(direction)`: Move multiple steps based on direction
- `jumpToStart()`: Call TimelineManager.goToStart()
- `jumpToEnd()`: Call TimelineManager.goToEnd()

Scrubbing will move 50 steps per key press for fast navigation. The keystrokes will only be active when `this.isHostMode` is true and Timeline Manager is available.

Update `KeystrokeOverlay` to include all timeline keystrokes with proper modifier key documentation.

## Related Pitches

- **Prerequisites**:
  - [Keystroke Help Menu (Timeline series: 1)](../../pitches/keystroke-help-menu.md)
  - [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
  - [Timeline UI Components (Timeline series: 4)](../../pitches/timeline-ui-components.md)
- **Next**: [Timeline Network Synchronization (Timeline series: 6)](../../pitches/timeline-network-synchronization.md)
- **Depends on**: KeyboardHandler, TimelineManager

## Prerequisites

- Keystroke Help Menu (Timeline series: 1) - establishes modifier key pattern
- Timeline Engine Core (Timeline series: 2) - provides timeline navigation methods
- Playback Controls & Game Loop Integration (Timeline series: 3) - provides playback state management
- Timeline UI Components (Timeline series: 4) - provides status updates

## Next Logical Pitches

- [Timeline Network Synchronization (Timeline series: 6)](../../pitches/timeline-network-synchronization.md)

## Open Questions

- Should scrub speed be configurable or fixed at 50 steps per press? (Use default for now)
- Should there be a "fast scrub" key combination for even faster navigation? (Not in scope)

## Timeline Series Context

This deliverable provides the keyboard interface for all timeline features. It completes the local/host mode experience by making timeline controls accessible via intuitive keystrokes. The final deliverable will add network synchronization to allow clients to follow the host's timeline navigation.
