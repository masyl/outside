# Timeline UI Components (Timeline series: 4)

## Motivation

Users need visual feedback for timeline state and position. With playback controls implemented in the previous deliverable, we need UI components that show the timeline bar, current playback status, and allow visual navigation. This provides an intuitive interface for time travel features.

## Solution

Create timeline bar component (thick green bar with black opaque padding) and playback status indicator in debug info panel. The timeline bar will visually represent the event history and show current position, while the status indicator will display whether the game is PLAYING, PAUSED, or TRAVELING through time.

## Inclusions

- Timeline bar component:
  - Thick green bar with black opaque padding
  - Visual indicator for current position in history
  - Proportional width based on current step vs total steps
  - Positioned at bottom of screen (or configurable)
  - Responsive to window resize
- Playback status indicator in DebugOverlay:
  - Display current playback state: PLAYING, PAUSED, TRAVELING
  - Update in real-time as playback state changes
  - Use existing debug overlay styling
- Timeline position display:
  - Show current step number
  - Show total steps in history
  - Format: "Step: 1234 / 5000"
- DebugOverlay integration:
  - Extend existing DebugOverlay class
  - Add timeline-specific fields
  - Update on playback state changes
- Responsive design:
  - Timeline bar adapts to screen width
  - Status indicator maintains readability at different resolutions
- Styling:
  - Match existing debug aesthetic
  - Green bar with black padding as specified
  - Clean, high-contrast design

## Exclusions

- Timeline bar interactivity (scrubbing) - timeline navigation through UI only
- Keystroke handlers - covered in Timeline Keystrokes Integration
- Network timeline bar for clients - covered in Timeline Network Synchronization
- Playback controls buttons in debug menu (deprecated feature)

## Implementation Details

Create `TimelineBar` class in `outside-client/src/ui/timelineBar.ts` that extends PIXI `Container`. The bar will use PIXI `Graphics` for the green background and a smaller `Graphics` rectangle for the position indicator. Position will be calculated as `(currentStep / totalSteps) * barWidth`.

Extend `DebugOverlay` in `outside-client/src/debug/overlay.ts` to add timeline status fields. Add methods `setPlaybackState(state)` and `setTimelinePosition(currentStep, totalSteps)` to update the display.

The timeline bar will be added to the PIXI stage in `main.ts` and positioned at the bottom of the screen. It will only be visible when in host mode.

## Related Pitches

- **Prerequisites**:
  - [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
- **Next**: [Timeline Keystrokes Integration (Timeline series: 5)](../../pitches/timeline-keystrokes-integration.md)
- **Depends on**: DebugOverlay, TimelineManager, PIXI

## Prerequisites

- Timeline Engine Core (Timeline series: 2) - provides timeline position data
- Playback Controls & Game Loop Integration (Timeline series: 3) - provides playback state

## Next Logical Pitches

- [Timeline Keystrokes Integration (Timeline series: 5)](../../pitches/timeline-keystrokes-integration.md)
- [Timeline Network Synchronization (Timeline series: 6)](../../pitches/timeline-network-synchronization.md)

## Open Questions

- Should timeline bar be visible in client mode? (Answer: Only visible in host mode for now)
- Should the timeline bar have any visual indication of the 10,000 step limit? (Not specified)

## Timeline Series Context

This deliverable provides visual interface for timeline features. It makes timeline state visible to users and establishes the visual language (green timeline bar) that will be synchronized to clients in the final deliverable.
