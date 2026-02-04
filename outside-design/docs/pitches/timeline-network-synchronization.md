---
Title: "Timeline Network Synchronization (Timeline series: 6)"
Category: Timeline
---

# Timeline Network Synchronization (Timeline series: 6)

## Motivation

With local timeline controls complete, multiplayer support requires that clients follow the host's timeline navigation. When the host travels through time, connected clients should see the same historical state, display timeline feedback, and reconstruct their local state to match the host's position. This ensures consistent multiplayer experience across all timeline features.

## Solution

Broadcast host's timeline pointer position to clients and provide client-side UI feedback. Each client will maintain their own event history (already persisted via EventLogger) and reconstruct state to match the host's timeline position. Clients will see a visual "Time travelling..." overlay and timeline bar that mirrors the host's position.

## Inclusions

- Host timeline pointer broadcasting:
  - Send current step number to all clients when timeline position changes
  - Broadcast on: step forward/backward, jump to start/end, scrub
  - Use existing WebRTC data channel for timeline updates
- Client timeline overlay:
  - 20% black overlay on viewport during time travel
  - "Time travelling..." notice at center of viewport
  - Dismissible (or auto-dismiss when timeline ends)
- Client timeline bar:
  - Mirror host's timeline position
  - Show host's current step and total steps
  - Same green bar design as host
- Client state synchronization:
  - Reconstruct local state from events to match host's step
  - Use existing EventLogger and Timeline Manager methods
  - Ensure client state matches host exactly
- Timeline control restrictions:
  - Timeline controls only available to host
  - Client mode ignores timeline keystrokes
  - Client cannot navigate timeline independently
- Network protocol for timeline updates:
  - Message type: "TIMELINE_UPDATE"
  - Payload: `{ step: number, totalSteps: number, isTraveling: boolean }`
  - Update frequency: On every host timeline position change
- Client UI integration:
  - Add timeline bar to client viewport
  - Show playback state from host
  - Update timeline overlay based on host's isTraveling state

## Exclusions

- Timeline engine core, playback controls, UI components, keystrokes - all covered in previous deliverables
- Client-side autonomy during timeline - bots follow server state by design
- Timeline conflict resolution (client out of sync) - assume reliable network

## Implementation Details

Extend `HostMode` in `outside-client/src/network/host.ts` to broadcast timeline updates. Add `broadcastTimelineUpdate()` method that sends TIMELINE_UPDATE message with current timeline state after every Timeline Manager navigation.

Extend `ClientMode` in `outside-client/src/network/client.ts` to receive timeline updates. Add handler for "TIMELINE_UPDATE" message that:

1. Updates local Timeline Manager pointer position
2. Shows/hides timeline overlay based on `isTraveling`
3. Updates client timeline bar position
4. Reconstructs state from events to match host's step

Create `ClientTimelineOverlay` class in `outside-client/src/debug/clientTimelineOverlay.ts` (DOM-based) for the 20% black overlay and "Time travelling..." notice.

Client timeline bar will reuse existing `TimelineBar` class but be positioned in client viewport and only update based on host broadcasts.

## Related Pitches

- **Prerequisites**:
  - [Timeline Engine Core (Timeline series: 2)](../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../pitches/timeline-playback-controls.md)
  - [Timeline UI Components (Timeline series: 4)](../pitches/timeline-ui-components.md)
  - [Timeline Keystrokes Integration (Timeline series: 5)](../pitches/timeline-keystrokes-integration.md)
- **Next**: None (final deliverable in series)
- **Depends on**: HostMode, ClientMode, TimelineManager, EventLogger

## Prerequisites

- Timeline Engine Core (Timeline series: 2) - timeline infrastructure
- Playback Controls & Game Loop Integration (Timeline series: 3) - playback state management
- Timeline UI Components (Timeline series: 4) - timeline bar component
- Timeline Keystrokes Integration (Timeline series: 5) - complete local timeline controls

## Next Logical Pitches

None - this completes the Timeline Controls series.

## Open Questions

- Should client timeline overlay be dismissible by client? (Answer: Auto-dismiss when host stops traveling)
- Should clients see different color on timeline bar to indicate they're following host? (Not specified)

## Timeline Series Context

This is the final deliverable in the Timeline Controls series. It extends all previous timeline features to work in multiplayer by synchronizing clients with the host's timeline navigation. Clients will see the same historical state and timeline position as the host, providing a consistent time-travel experience across multiplayer sessions.
