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
  - [Timeline Engine Core (Timeline series: 2)](../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../pitches/timeline-playback-controls.md)
- **Next**: [Timeline Keystrokes Integration (Timeline series: 5)](../pitches/timeline-keystrokes-integration.md)
- **Depends on**: DebugOverlay, TimelineManager, PIXI

## Prerequisites

- Timeline Engine Core (Timeline series: 2) - provides timeline position data
- Playback Controls & Game Loop Integration (Timeline series: 3) - provides playback state

## Next Logical Pitches

- [Timeline Keystrokes Integration (Timeline series: 5)](../pitches/timeline-keystrokes-integration.md)
- [Timeline Network Synchronization (Timeline series: 6)](../pitches/timeline-network-synchronization.md)

## Pitch Review Questions

- Q: Should timeline bar be visible in client mode?
  - A: Only visible in Local and Host mode.
  - A: Special Client behavior will be done later.

- Q: Should the timeline bar have any visual indication of the 10,000 step limit? (Not specified)
- A: Not for now.

- Q: Timeline bar interactivity: Should users be able to click the timeline bar to jump to specific positions, or should it be purely visual for now?
  - A: The timeline should be clickable. It moves the time cursor while the user keeps the mouse down. A single click move the cursor at that position.

- Q: Integration approach: Do you prefer a separate timeline bar component at the bottom of screen, or should it be integrated into the existing DebugOverlay panel?
  - A: It's a separate UI.
- Q: Visibility control: Should the timeline bar only be visible in host mode, or do you want a way to toggle visibility?
  - A: The toolbar should become visible only when the game starts travelling in time. Once the game resumes the normal PLAY mode at the head of the event stream, it disapears.

- Q: Any styling preferences: Beyond the "green bar with black padding" specification, any specific height, positioning, or visual effects you'd like?
  - A: Keep the green pixelated aesthetic and fonts. This first timeline UI will be for debugging and development. Better looking timelines could be added later to be used "in game".
  - A: We can tweak the look together during the implementation.

- Q: Mouse interaction behavior: When the user holds down mouse and moves, should the timeline update continuously (every mouse move) or should there be some throttling/debouncing?
  - A: Yes, add some debounce and throttling to prevent spamming the CPU.

- Q: Edge case handling: What should happen when:
  - Q: Total steps = 0 (empty timeline)?
    - A: Nothing special. At that point the world state should simply already be blank.
  - Q: User clicks outside the green bar but inside the padding?
    - A: Nothing for now.
  - Q: User drags beyond the timeline boundaries?
    - A: The cursor should never go out of bound and respect the boundaries of the timeline.

- Q: Visual feedback: Should there be any visual indication when the timeline is interactive (hover state, cursor change, etc.)?
  - A: The cursor point should change to a hand and the color of the border should be a little brighter.

- Q: Animation: Should the position marker animate to new positions or jump instantly?
  - A: Jump instantly for now.

- Q: Mode specificity: Should the timeline behave differently in Local vs Host mode, or just visibility control?
  - The idead of a "local" mode is just being a host without waiting for inbound clients. So the timeline should behave the same. Only in Client mode is the bar hidden by default.
