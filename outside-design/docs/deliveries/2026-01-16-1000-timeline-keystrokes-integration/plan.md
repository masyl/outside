## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Implementation Plan: Timeline Keystrokes Integration

## Overview

This plan adds timeline control keystrokes to KeyboardHandler using modifier key pattern established in Keystroke Help Menu. It provides keyboard interface for all timeline features, completing the local/host mode experience.

## Architectural Principles

1. **Modifier Key Pattern**: Option (Mac) / Alt (Windows) for advanced controls
2. **Host Mode Only**: Timeline keystrokes only active in host mode
3. **Conflict Prevention**: Modifiers prevent conflicts with existing shortcuts
4. **Documentation**: All keystrokes documented in help menu

## File Structure

```
outside-client/src/
├── input/
│   └── keyboardHandler.ts    # Modify: Add timeline keystrokes
└── debug/
    └── keystrokeOverlay.ts  # Modify: Add timeline keystrokes to help menu
```

## Implementation Steps

### Phase 1: Keyboard Handler Extensions

**Modify `keyboardHandler.ts`**

- Add timeline keystrokes:

  ```typescript
  // Option/Alt + Space: Toggle play/pause
  this.keyHandlers.set(' ', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.togglePausePlayback();
    }
  });

  // Option/Alt + Up: Step forward
  this.keyHandlers.set('ArrowUp', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.stepForward();
    }
  });

  // Option/Alt + Down: Step backward
  this.keyHandlers.set('ArrowDown', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.stepBackward();
    }
  });

  // Option/Alt + Left: Scrub backward (50 steps)
  this.keyHandlers.set('ArrowLeft', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.scrubTimeline('backward');
    }
  });

  // Option/Alt + Right: Scrub forward (50 steps)
  this.keyHandlers.set('ArrowRight', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.scrubTimeline('forward');
    }
  });

  // Option/Alt + Home: Jump to start
  this.keyHandlers.set('Home', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.jumpToStart();
    }
  });

  // Option/Alt + End: Jump to end
  this.keyHandlers.set('End', (event) => {
    if (event.altKey && this.isHostMode && this.timelineManager) {
      event.preventDefault();
      this.jumpToEnd();
    }
  });
  ```

### Phase 2: Helper Methods

**Add to `keyboardHandler.ts`**

```typescript
private togglePausePlayback(): void {
  if (this.timelineManager) {
    const currentState = this.timelineManager.getPlaybackState();
    const newState = currentState === PlaybackState.PLAYING
      ? PlaybackState.PAUSED
      : PlaybackState.PLAYING;

    // Update playback state
    this.timelineManager.setPlaybackState(newState);

    // Update Game Loop
    if (this.gameLoop) {
      if (newState === PlaybackState.PAUSED) {
        this.gameLoop.pause();
      } else {
        this.gameLoop.resume();
      }
    }
  }
}

private stepForward(): void {
  if (this.timelineManager) {
    this.timelineManager.stepForward();
  }
}

private stepBackward(): void {
  if (this.timelineManager) {
    this.timelineManager.stepBackward();
  }
}

private scrubTimeline(direction: 'forward' | 'backward'): void {
  if (this.timelineManager) {
    const events = this.timelineManager.getEvents();
    const currentStep = this.timelineManager.getCurrentStep();
    const scrubAmount = 50;

    let targetStep: number;
    if (direction === 'forward') {
      targetStep = Math.min(currentStep + scrubAmount, events.length - 1);
    } else {
      targetStep = Math.max(currentStep - scrubAmount, 0);
    }

    this.timelineManager.goToStep(targetStep);
  }
}

private jumpToStart(): void {
  if (this.timelineManager) {
    this.timelineManager.goToStart();
  }
}

private jumpToEnd(): void {
  if (this.timelineManager) {
    this.timelineManager.goToEnd();
  }
}
```

### Phase 3: Existing Debug Keystroke Updates

**Modify `keyboardHandler.ts`**

- Map existing debug keystrokes to modifier pattern:

  ```typescript
  // Existing R keystroke (in debug menu)
  this.keyHandlers.set('r', (event) => {
    // Only handle if NOT in debug menu OR if Option/Alt is pressed
    if (event.altKey && this.debugMenu?.isOpen()) {
      event.preventDefault();
      this.debugMenu?.onResetLevel?.();
    }
  });

  // Existing A keystroke (in debug menu)
  this.keyHandlers.set('a', (event) => {
    if (event.altKey && this.debugMenu?.isOpen()) {
      event.preventDefault();
      this.debugMenu?.onToggleAutonomy?.();
    }
  });
  ```

### Phase 4: Timeline Manager Extensions

**Modify `timeline/manager.ts`**

- Add getter for current step:

  ```typescript
  getCurrentStep(): number {
    return this.pointer;
  }

  getEvents(): TimelineEvent[] {
    return this.eventLogger.getEvents();
  }
  ```

### Phase 5: Keystroke Overlay Updates

**Modify `debug/keystrokeOverlay.ts`**

- Add timeline keystrokes to KEYSTROKES array:

  ```typescript
  const KEYSTROKES: KeystrokeEntry[] = [
    // ... existing keystrokes

    {
      keys: ['Option/Alt + Space'],
      description: 'Toggle play/pause',
      modifier: 'Option on Mac, Alt on Windows',
      category: 'Timeline',
    },
    {
      keys: ['Option/Alt + ↑', 'Option/Alt + ↓'],
      description: 'Step forward/backward',
      modifier: 'Option on Mac, Alt on Windows',
      category: 'Timeline',
    },
    {
      keys: ['Option/Alt + ←', 'Option/Alt + →'],
      description: 'Scrub timeline',
      modifier: 'Option on Mac, Alt on Windows',
      category: 'Timeline',
    },
    {
      keys: ['Option/Alt + Home', 'Option/Alt + End'],
      description: 'Jump to start/end',
      modifier: 'Option on Mac, Alt on Windows',
      category: 'Timeline',
    },
  ];
  ```

### Phase 6: Initialization

**Modify `keyboardHandler.ts`**

- Add properties for timeline components:

  ```typescript
  private timelineManager: TimelineManager | null = null;
  private gameLoop: GameLoop | null = null;
  private isHostMode: boolean = false;

  setTimelineManager(manager: TimelineManager): void {
    this.timelineManager = manager;
  }

  setGameLoop(gameLoop: GameLoop): void {
    this.gameLoop = gameLoop;
  }

  setHostMode(isHost: boolean): void {
    this.isHostMode = isHost;
  }
  ```

**Modify `main.ts`**

- Connect components to KeyboardHandler:
  ```typescript
  keyboardHandler.setTimelineManager(timelineManager);
  keyboardHandler.setGameLoop(gameLoop);
  keyboardHandler.setHostMode(isHostMode);
  ```

## Checklist

- [x] Add Option/Alt + Space handler for play/pause
- [x] Add Option/Alt + Up/Down handlers for stepping
- [x] Add Option/Alt + Left/Right handlers for scrubbing
- [x] Add Option/Alt + Home/End handlers for jumping
- [x] Implement togglePausePlayback helper method
- [x] Implement scrubTimeline method (50 steps)
- [x] Add component properties to KeyboardHandler (gameLoop, isHostMode helper)
- [x] Add initialization in main.ts (setGameLoop)
- [x] Update keystroke overlay with timeline controls
- [ ] Map existing debug keystrokes to modifier pattern (Optional - skipped per plan)
- [x] getCurrentStep method already exists in Timeline Manager
- [ ] Test all timeline keystrokes
- [ ] Verify modifier key detection works on Mac and Windows
- [ ] Test keystrokes only work in host mode
- [ ] Test no conflicts with existing shortcuts
- [ ] Update pitches index

## Success Metrics

- All timeline keystrokes work with Option/Alt modifier
- Keystrokes only active in host mode
- No conflicts with existing bot movement shortcuts
- Keystroke help menu displays all timeline controls
- Modifier key pattern consistent across all advanced controls
- Scrubbing moves 50 steps per key press

## Notes

- Scrubbing speed is fixed at 50 steps per press for now
- Timeline keystrokes are completely ignored in client mode
- Existing debug keystrokes (R, A) now require Option/Alt modifier
- Modifiers prevent browser default behavior for all timeline keys
- This completes local/host mode timeline experience

## Related Pitches

- **Prerequisites**:
  - [Keystroke Help Menu (Timeline series: 1)](../../pitches/keystroke-help-menu.md)
  - [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
  - [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
  - [Timeline UI Components (Timeline series: 4)](../../pitches/timeline-ui-components.md)
- **Next**: [Timeline Network Synchronization (Timeline series: 6)](../../pitches/timeline-network-synchronization.md)
