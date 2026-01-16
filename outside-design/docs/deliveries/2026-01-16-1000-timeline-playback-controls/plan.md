## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Implementation Plan: Playback Controls & Game Loop Integration

## Overview

This plan details the integration of Timeline Manager with the Game Loop to support pause/resume, step-by-step execution, and playback state management. It controls bot autonomy based on playback state and manages the transition between normal play mode and timeline navigation mode.

## Architectural Principles

1. **Playback State Management**: Distinct states (PLAYING, PAUSED, TRAVELING) control game behavior
2. **Bot Autonomy Control**: Bots only move in PLAYING state
3. **Event Queue Isolation**: Timeline mode prevents new events from being processed
4. **Step-by-Step Execution**: Granular control for debugging and level design

## File Structure

```
outside-client/src/
├── game/
│   └── loop.ts              # Modify: Add pause/resume/step methods
├── network/
│   └── host.ts              # Modify: Sync timeline with Host
├── timeline/
│   └── manager.ts           # Modify: Add playback state tracking
└── bot/
    └── autonomy.ts            # Modify: Respect playback state
```

## Implementation Steps

### Phase 1: Game Loop Extensions

**Modify `game/loop.ts`**

- Add playback state tracking:

  ```typescript
  private playbackState: PlaybackState = PlaybackState.PLAYING;
  private timelineManager: TimelineManager | null = null;

  setTimelineManager(manager: TimelineManager): void {
    this.timelineManager = manager;
  }

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
  }
  ```

- Add pause/resume methods:

  ```typescript
  pause(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.setPlaybackState(PlaybackState.PAUSED);
  }

  resume(): void {
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => {
        this.update();
      }, 125);
    }
    this.setPlaybackState(PlaybackState.PLAYING);
  }
  ```

- Add step-by-step method:

  ```typescript
  step(): void {
    if (this.timelineManager) {
      this.timelineManager.stepForward();
      this.update();
    }
  }
  ```

- Modify `update()` method to respect playback state:

  ```typescript
  private update(): void {
    // Only process commands in PLAYING state
    if (this.playbackState === PlaybackState.PLAYING) {
      // ... existing command queue processing
    }

    // Always notify subscribers for state changes
    // (even in PAUSED/TRAVELING state)
  }
  ```

### Phase 2: Host Mode Integration

**Modify `network/host.ts`**

- Add timeline state management:

  ```typescript
  private playbackState: PlaybackState = PlaybackState.PLAYING;

  setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;

    // Pause autonomy in non-PLAYING states
    if (state !== PlaybackState.PLAYING) {
      this.pauseAutonomy();
    } else {
      this.resumeAutonomy();
    }
  }

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }
  ```

- Modify step counter to continue during timeline navigation:

  ```typescript
  private startStepCounter(): void {
    this.stepInterval = setInterval(() => {
      this.stepCount++;

      // Only process game logic in PLAYING state
      if (this.playbackState === PlaybackState.PLAYING) {
        this.processGameLogic();
      }

      // Always notify subscribers for UI updates
      this.notifySubscribers();
    }, 125);
  }
  ```

- Sync with Game Loop playback state:

  ```typescript
  initialize(gameLoop: GameLoop, timelineManager: TimelineManager): void {
    gameLoop.setTimelineManager(timelineManager);

    // Sync playback state changes
    timelineManager.onStateChange((state) => {
      this.setPlaybackState(state);
      gameLoop.setPlaybackState(state);
    });
  }
  ```

### Phase 3: Timeline Manager Enhancements

**Modify `timeline/manager.ts`**

- Add playback state tracking:

  ```typescript
  private playbackState: PlaybackState = PlaybackState.PLAYING;
  private stateChangeCallbacks: ((state: PlaybackState) => void)[] = [];

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.stateChangeCallbacks.forEach(callback => callback(state));
  }

  onStateChange(callback: (state: PlaybackState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }
  ```

- Update navigation methods to set playback state:

  ```typescript
  goToStep(stepNumber: number): void {
    this.setPlaybackState(PlaybackState.TRAVELING);
    // ... existing navigation logic
  }

  restoreEndState(): void {
    this.setPlaybackState(PlaybackState.PLAYING);
    // ... existing restore logic
  }
  ```

### Phase 4: Bot Autonomy Control

**Modify `bot/autonomy.ts`** (or wherever bot autonomy is implemented)

- Check playback state before generating movement:

  ```typescript
  function generateAutonomousMovement(
    bot: Bot,
    world: WorldState,
    playbackState: PlaybackState
  ): Command | null {
    // Only generate movement in PLAYING state
    if (playbackState !== PlaybackState.PLAYING) {
      return null;
    }

    // ... existing autonomy logic
  }
  ```

- Add autonomy pause/resume methods in HostMode:

  ```typescript
  private pauseAutonomy(): void {
    this.autonomyEnabled = false;
  }

  private resumeAutonomy(): void {
    this.autonomyEnabled = true;
  }
  ```

### Phase 5: Event Queue Management

**Modify `game/loop.ts`**

- Clear event queue when entering timeline mode:

  ```typescript
  enterTimelineMode(): void {
    this.pause();
    this.commandQueue.clear();
    this.setPlaybackState(PlaybackState.TRAVELING);
  }

  exitTimelineMode(): void {
    this.setPlaybackState(PlaybackState.PLAYING);
    // Don't auto-resume - let user decide
  }
  ```

- Prevent queue processing in timeline mode:

  ```typescript
  private processCommandQueue(): void {
    if (this.playbackState !== PlaybackState.PLAYING) {
      return; // Don't process queue in timeline mode
    }

    // ... existing queue processing
  }
  ```

### Phase 6: Main Initialization

**Modify `main.ts`**

- Connect components together:

  ```typescript
  const timelineManager = new TimelineManager(store, eventLogger);
  gameLoop.setTimelineManager(timelineManager);

  hostMode.initialize(gameLoop, timelineManager);

  // Initial playback state
  timelineManager.setPlaybackState(PlaybackState.PLAYING);
  gameLoop.setPlaybackState(PlaybackState.PLAYING);
  ```

## Checklist

- [ ] Add playback state to Game Loop
- [ ] Implement pause/resume methods in Game Loop
- [ ] Implement step-by-step method in Game Loop
- [ ] Add playback state management to Host Mode
- [ ] Modify step counter to continue during timeline navigation
- [ ] Add state change callbacks to Timeline Manager
- [ ] Update Timeline Manager navigation methods to set playback state
- [ ] Implement bot autonomy control based on playback state
- [ ] Add autonomy pause/resume methods to Host Mode
- [ ] Implement event queue clearing in timeline mode
- [ ] Prevent queue processing in timeline mode
- [ ] Connect all components in main.ts
- [ ] Test pause/resume transitions
- [ ] Test step-by-step execution
- [ ] Verify autonomy pauses in timeline mode
- [ ] Test event queue isolation
- [ ] Update pitches index

## Success Metrics

- Game Loop pauses and resumes correctly
- Step-by-step execution processes one event per step
- Bot autonomy stops in PAUSED and TRAVELING states
- Bot autonomy resumes in PLAYING state
- Event queue is cleared when entering timeline mode
- New events are not processed in timeline mode
- Playback state is consistent across all components

## Notes

- Step counter continues incrementing in all states for UI tracking
- Autonomy is disabled in all non-PLAYING states
- Timeline mode (TRAVELING) is distinct from PAUSED
- Users must explicitly resume after navigating timeline
- Event queue isolation prevents inconsistent states during time travel

## Related Pitches

- **Prerequisites**:
  - [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
- **Next**: [Timeline UI Components (Timeline series: 4)](../../pitches/timeline-ui-components.md)
