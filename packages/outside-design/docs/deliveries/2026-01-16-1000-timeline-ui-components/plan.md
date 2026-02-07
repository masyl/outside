## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Implementation Plan: Timeline UI Components

## Overview

This plan details implementation of timeline bar component and playback status indicator. It provides visual feedback for timeline state and position, making timeline features visible and intuitive to users.

## Architectural Principles

1. **Visual Timeline Representation**: Green bar shows current position in event history
2. **Real-Time Updates**: UI updates immediately on timeline position changes
3. **Host Mode Only**: Timeline controls are host-only feature
4. **Consistent Styling**: Match existing debug aesthetic

## File Structure

```
packages/outside-client/src/
├── ui/
│   └── timelineBar.ts      # New: Timeline bar component
└── debug/
    └── overlay.ts           # Modify: Add timeline status fields
```

## Implementation Steps

### Phase 1: Timeline Bar Component

**Create `ui/timelineBar.ts`**

```typescript
import { Container, Graphics } from 'pixi.js';

export class TimelineBar extends Container {
  private background: Graphics;
  private indicator: Graphics;
  private totalSteps: number = 0;
  private currentStep: number = 0;

  constructor() {
    super();

    // Background (green bar with black padding)
    this.background = new Graphics();
    this.background.rect(0, 0, 100, 20); // Width will be dynamic
    this.background.fill(0x00ff00); // Green
    this.addChild(this.background);

    // Indicator (shows current position)
    this.indicator = new Graphics();
    this.indicator.rect(0, 0, 5, 20); // Will expand based on position
    this.indicator.fill(0x000000); // Black
    this.indicator.alpha = 0.8; // Slightly transparent
    this.addChild(this.indicator);
  }

  updatePosition(currentStep: number, totalSteps: number): void {
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;

    const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
    const indicatorWidth = Math.max(5, progress * 100);

    // Clear and redraw indicator
    this.indicator.clear();
    this.indicator.rect(0, 0, indicatorWidth, 20);
    this.indicator.fill(0x000000);
  }

  setWidth(width: number): void {
    // Resize background to match screen width (minus padding)
    this.background.clear();
    this.background.rect(0, 0, width, 20);
    this.background.fill(0x00ff00);

    // Update indicator width
    this.updatePosition(this.currentStep, this.totalSteps);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }
}
```

### Phase 2: Debug Overlay Enhancements

**Modify `debug/overlay.ts`**

- Add timeline status fields:

  ```typescript
  private playbackStateElement: HTMLElement | null = null;
  private timelinePositionElement: HTMLElement | null = null;

  // In constructor, after existing elements
  this.playbackStateElement = this.createTimelineField('Playback', 'PLAYING');
  this.timelinePositionElement = this.createTimelineField('Timeline', '0 / 0');

  // Add to container
  if (this.playbackStateElement) {
    this.container.appendChild(this.playbackStateElement);
  }
  if (this.timelinePositionElement) {
    this.container.appendChild(this.timelinePositionElement);
  }

  private createTimelineField(label: string, initialValue: string): HTMLElement {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.marginBottom = '4px';

    const labelElement = document.createElement('span');
    labelElement.textContent = label + ':';
    labelElement.style.color = '#888';

    const valueElement = document.createElement('span');
    valueElement.textContent = initialValue;
    valueElement.style.fontFamily = 'monospace';
    valueElement.style.color = '#00ff00';

    row.appendChild(labelElement);
    row.appendChild(valueElement);

    return row;
  }
  ```

- Add update methods:

  ```typescript
  setPlaybackState(state: PlaybackState): void {
    if (this.playbackStateElement) {
      const valueElement = this.playbackStateElement.querySelector('span:last-child');
      if (valueElement) {
        valueElement.textContent = state;
        valueElement.style.color = state === 'PLAYING' ? '#00ff00' : '#ffaa00';
      }
    }
  }

  setTimelinePosition(currentStep: number, totalSteps: number): void {
    if (this.timelinePositionElement) {
      const valueElement = this.timelinePositionElement.querySelector('span:last-child');
      if (valueElement) {
        valueElement.textContent = `${currentStep} / ${totalSteps}`;
      }
    }
  }
  ```

### Phase 3: Main Integration

**Modify `main.ts`**

- Create and position timeline bar:

  ```typescript
  const timelineBar = new TimelineBar();
  timelineBar.setVisible(false); // Hidden initially (only in host mode)

  // Position at bottom of screen
  timelineBar.x = 0;
  timelineBar.y = window.innerHeight - 25;

  // Add to stage
  app.stage.addChild(timelineBar);

  // Handle resize
  window.addEventListener('resize', () => {
    timelineBar.y = window.innerHeight - 25;
    timelineBar.setWidth(window.innerWidth);
  });

  // Initial width
  timelineBar.setWidth(window.innerWidth);
  ```

- Connect timeline bar to Timeline Manager:

  ```typescript
  timelineManager.onPositionChange((currentStep, totalSteps) => {
    timelineBar.updatePosition(currentStep, totalSteps);
    debugOverlay.setTimelinePosition(currentStep, totalSteps);
  });
  ```

- Connect playback state to debug overlay:

  ```typescript
  timelineManager.onStateChange((state) => {
    debugOverlay.setPlaybackState(state);
  });

  // Only show timeline bar in host mode
  if (isHostMode) {
    timelineBar.setVisible(true);
  }
  ```

### Phase 4: Timeline Manager Callbacks

**Modify `timeline/manager.ts`**

- Add position change callback support:

  ```typescript
  private positionChangeCallbacks: ((currentStep: number, totalSteps: number) => void)[] = [];

  onPositionChange(callback: (currentStep: number, totalSteps: number) => void): void {
    this.positionChangeCallbacks.push(callback);
  }

  private notifyPositionChange(): void {
    const events = this.eventLogger.getEvents();
    this.positionChangeCallbacks.forEach(callback => {
      callback(this.pointer, events.length);
    });
  }
  ```

- Trigger callbacks in navigation methods:

  ```typescript
  goToStep(stepNumber: number): void {
    // ... existing logic
    this.notifyPositionChange();
  }

  stepForward(): void {
    this.goToStep(this.pointer + 1);
  }

  stepBackward(): void {
    this.goToStep(this.pointer - 1);
  }
  ```

## Checklist

- [ ] Create TimelineBar class with green bar design
- [ ] Add position indicator to TimelineBar
- [ ] Implement updatePosition method in TimelineBar
- [ ] Add setWidth method for responsive design
- [ ] Add playback state field to DebugOverlay
- [ ] Add timeline position field to DebugOverlay
- [ ] Implement setPlaybackState in DebugOverlay
- [ ] Implement setTimelinePosition in DebugOverlay
- [ ] Create and position timeline bar in main.ts
- [ ] Connect timeline bar to Timeline Manager
- [ ] Add position change callbacks to Timeline Manager
- [ ] Trigger callbacks in navigation methods
- [ ] Handle window resize for timeline bar
- [ ] Show timeline bar only in host mode
- [ ] Test timeline bar visual updates
- [ ] Test debug overlay status updates
- [ ] Test responsive design on resize
- [ ] Update pitches index

## Success Metrics

- Timeline bar appears at bottom of screen in host mode
- Green bar with black indicator shows current position
- Indicator updates in real-time on timeline navigation
- Debug overlay shows correct playback state
- Debug overlay shows accurate timeline position
- Timeline bar adapts to window width on resize
- Timeline bar is hidden in client mode

## Notes

- Timeline bar uses green (#00ff00) as specified in pitch
- Black indicator is 80% opaque for visibility
- Timeline bar is only visible in host mode
- Status indicator uses green for PLAYING, orange for other states
- Position format: "currentStep / totalSteps"

## Related Pitches

- **Prerequisites**:
  - [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
- **Next**: [Timeline Keystrokes Integration (Timeline series: 5)](../../pitches/timeline-keystrokes-integration.md)
