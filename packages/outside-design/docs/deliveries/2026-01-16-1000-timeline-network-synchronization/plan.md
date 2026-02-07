## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Implementation Plan: Timeline Network Synchronization

## Overview

This plan details implementation of network synchronization for timeline features. It enables clients to follow host's timeline navigation by broadcasting timeline pointer position and providing client-side UI feedback.

## Architectural Principles

1. **Host Control**: Only host can navigate timeline, clients follow
2. **Event Replay**: Clients reconstruct state from their own event history
3. **Visual Feedback**: Clients see overlay and timeline bar during time travel
4. **State Consistency**: All clients see same historical state as host

## File Structure

```
packages/outside-client/src/
├── network/
│   ├── host.ts              # Modify: Broadcast timeline updates
│   └── client.ts            # Modify: Receive and sync timeline updates
├── debug/
│   └── clientTimelineOverlay.ts  # New: Client time travel overlay
└── ui/
    └── timelineBar.ts      # Modify: Support client mode
```

## Implementation Steps

### Phase 1: Host Timeline Broadcasting

**Modify `network/host.ts`**

- Add timeline broadcasting method:

  ```typescript
  broadcastTimelineUpdate(): void {
    if (this.timelineManager && this.peers.length > 0) {
      const events = this.timelineManager.getEvents();
      const update = {
        type: 'TIMELINE_UPDATE',
        payload: {
          step: this.timelineManager.getCurrentStep(),
          totalSteps: events.length,
          isTraveling: this.timelineManager.getPlaybackState() === PlaybackState.TRAVELING
        }
      };

      this.peers.forEach(peer => {
        peer.send(JSON.stringify(update));
      });
    }
  }
  ```

- Connect to Timeline Manager position changes:

  ```typescript
  initializeTimelineBroadcast(timelineManager: TimelineManager): void {
    this.timelineManager = timelineManager;

    timelineManager.onPositionChange((currentStep, totalSteps) => {
      this.broadcastTimelineUpdate();
    });

    timelineManager.onStateChange((state) => {
      if (state === PlaybackState.TRAVELING) {
        this.broadcastTimelineUpdate();
      }
    });
  }
  ```

### Phase 2: Client Timeline Reception

**Modify `network/client.ts`**

- Add timeline update handler:

  ```typescript
  handleTimelineUpdate(data: { step: number; totalSteps: number; isTraveling: boolean }): void {
    if (this.timelineManager) {
      // Update local timeline position
      this.timelineManager.goToStep(data.step);

      // Show/hide client overlay
      if (this.clientTimelineOverlay) {
        this.clientTimelineOverlay.setVisible(data.isTraveling);
      }

      // Update client timeline bar
      if (this.timelineBar) {
        this.timelineBar.updatePosition(data.step, data.totalSteps);
      }
    }
  }
  ```

- Add timeline components initialization:

  ```typescript
  private timelineManager: TimelineManager | null = null;
  private clientTimelineOverlay: ClientTimelineOverlay | null = null;
  private timelineBar: TimelineBar | null = null;

  setTimelineComponents(
    timelineManager: TimelineManager,
    clientTimelineOverlay: ClientTimelineOverlay,
    timelineBar: TimelineBar
  ): void {
    this.timelineManager = timelineManager;
    this.clientTimelineOverlay = clientTimelineOverlay;
    this.timelineBar = timelineBar;
  }
  ```

- Add to message handler:
  ```typescript
  handleData(data: any): void {
    if (data.type === 'TIMELINE_UPDATE') {
      this.handleTimelineUpdate(data.payload);
    }
    // ... other message handlers
  }
  ```

### Phase 3: Client Timeline Overlay

**Create `debug/clientTimelineOverlay.ts`**

```typescript
export class ClientTimelineOverlay {
  private container: HTMLElement;
  private noticeElement: HTMLElement;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'client-timeline-overlay';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'; // 20% black
    this.container.style.zIndex = '10003';
    this.container.style.pointerEvents = 'none'; // Allow clicking through
    this.container.style.display = 'none'; // Hidden by default

    // Create notice element
    this.noticeElement = document.createElement('div');
    this.noticeElement.textContent = 'Time travelling...';
    this.noticeElement.style.position = 'absolute';
    this.noticeElement.style.top = '50%';
    this.noticeElement.style.left = '50%';
    this.noticeElement.style.transform = 'translate(-50%, -50%)';
    this.noticeElement.style.color = '#00ff00';
    this.noticeElement.style.fontFamily = 'monospace';
    this.noticeElement.style.fontSize = '24px';
    this.noticeElement.style.fontWeight = 'bold';

    this.container.appendChild(this.noticeElement);
    document.body.appendChild(this.container);
  }

  setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'block' : 'none';
  }
}
```

### Phase 4: Timeline Bar Client Support

**Modify `ui/timelineBar.ts`**

- No changes needed - already supports position updates
- Ensure bar is visible in client mode when receiving timeline updates

### Phase 5: Client Initialization

**Modify `main.ts`**

- Create client timeline components:

  ```typescript
  // In client mode initialization
  const clientTimelineOverlay = new ClientTimelineOverlay();

  const clientTimelineBar = new TimelineBar();
  clientTimelineBar.x = 0;
  clientTimelineBar.y = window.innerHeight - 25;
  clientTimelineBar.setWidth(window.innerWidth);
  app.stage.addChild(clientTimelineBar);

  // Connect to ClientMode
  clientMode.setTimelineComponents(timelineManager, clientTimelineOverlay, clientTimelineBar);
  ```

- Handle resize for client timeline bar:
  ```typescript
  window.addEventListener('resize', () => {
    clientTimelineBar.y = window.innerHeight - 25;
    clientTimelineBar.setWidth(window.innerWidth);
  });
  ```

### Phase 6: CSS Styling

**Add CSS for client overlay:**

```css
#client-timeline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 10003;
  pointer-events: none;
  display: none;
}

#client-timeline-overlay.visible {
  display: block;
}
```

## Checklist

- [ ] Add broadcastTimelineUpdate method to HostMode
- [ ] Add initializeTimelineBroadcast to HostMode
- [ ] Add handleTimelineUpdate method to ClientMode
- [ ] Add timeline components properties to ClientMode
- [ ] Add timeline update handler to client message handler
- [ ] Create ClientTimelineOverlay class
- [ ] Style client overlay with 20% black background
- [ ] Add "Time travelling..." notice text
- [ ] Set pointer-events: none for overlay
- [ ] Create client timeline bar instance
- [ ] Position client timeline bar at bottom of screen
- [ ] Connect client components to ClientMode
- [ ] Add CSS styling for client overlay
- [ ] Test host timeline broadcasts to clients
- [ ] Test client state reconstruction
- [ ] Test client overlay visibility
- [ ] Test client timeline bar updates
- [ ] Test timeline bar visibility in client mode
- [ ] Update pitches index

## Success Metrics

- Host broadcasts timeline position to all clients
- Clients receive and sync to host's timeline position
- Client overlay appears during time travel
- Client timeline bar mirrors host's position
- Client state matches host's historical state
- Timeline controls disabled in client mode
- Overlay is dismissible (or auto-dismisses when host stops traveling)

## Notes

- Clients use their own event history to reconstruct state
- Timeline updates are broadcast on every position change
- Overlay uses 20% black background as specified
- Overlay is auto-dismissed based on isTraveling state
- Timeline bar is visible in client mode when receiving updates
- This completes the Timeline Controls series

## Related Pitches

- **Prerequisites**:
  - [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
  - [Timeline UI Components (Timeline series: 4)](../../pitches/timeline-ui-components.md)
  - [Timeline Keystrokes Integration (Timeline series: 5)](../../pitches/timeline-keystrokes-integration.md)
- **Next**: None (final deliverable in series)
