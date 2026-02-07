## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Implementation Plan: Timeline Engine Core

## Overview

This plan details the implementation of the core timeline engine that enables time navigation through event history. This foundational component supports all subsequent timeline features by providing the ability to move through time, cache states, and manage event history.

## Architectural Principles

1. **Event-Sourced Navigation**: All state changes are recorded as events; timeline navigation reconstructs state by replaying events
2. **Pointer in Time**: Virtual "pointer" tracks current position in event history without deleting events
3. **Performance Optimization**: Original value storage and end state caching enable fast navigation
4. **10,000 Step Limit**: Enforce limit with event collapse to prevent memory issues

## File Structure

```
packages/outside-client/src/
├── timeline/
│   ├── manager.ts           # New: Timeline state manager
│   ├── playbackState.ts     # New: Playback state enum
│   └── types.ts            # New: Timeline types
├── store/
│   ├── persistence.ts       # Modify: Add originalValue to events
│   └── store.ts            # Modify: Integrate with TimelineManager
└── commands/
    ├── handlers.ts          # Modify: Add originalValue to actions
    └── parser.ts           # Modify: No changes needed
```

## Implementation Steps

### Phase 1: Timeline Types

**Create `timeline/types.ts`**

```typescript
export interface TimelineEvent {
  action: Action;
  timestamp: number;
  step: number;
  originalValue?: any; // New: Original value before change
}

export interface TimelineConfig {
  maxEvents: number;
  collapseThreshold: number;
}

export interface TimelineState {
  currentStep: number;
  mode: 'normal' | 'timeline';
  totalSteps: number;
}
```

### Phase 2: Playback State Enum

**Create `timeline/playbackState.ts`**

```typescript
export enum PlaybackState {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  TRAVELING = 'TRAVELING',
}
```

### Phase 3: Event Enhancement

**Modify `store/persistence.ts`**

- Update `Event` interface to include `step` parameter:
  ```typescript
  logEvent(action: Action, timestamp?: number, step?: number) {
    const event: TimelineEvent = {
      action,
      timestamp: timestamp || Date.now(),
      step: step || 0
    };
    // ... existing logic
  }
  ```

**Modify `commands/handlers.ts`**

- For each handler, extract and store original value:
  ```typescript
  export function executeCommand(store: Store, command: ParsedCommand, step?: number) {
    switch (command.type) {
      case CommandType.MOVE_OBJECT:
        const object = store.getState().objects.get(command.params.id);
        const originalPosition = { x: object?.x, y: object?.y }; // Extract original
        const action = moveObject(
          command.params.id,
          command.params.direction,
          command.params.distance
        );
        action.originalValue = originalPosition; // Attach original value
        store.dispatch(action, step);
        break;
      // ... similar for other commands
    }
  }
  ```

### Phase 4: Timeline Manager

**Create `timeline/manager.ts`**

```typescript
export class TimelineManager {
  private store: Store;
  private eventLogger: EventLogger;
  private config: TimelineConfig;
  private endStateCache: WorldState | null = null;
  private pointer: number = 0;

  constructor(store: Store, eventLogger: EventLogger, config?: Partial<TimelineConfig>) {
    this.store = store;
    this.eventLogger = eventLogger;
    this.config = {
      maxEvents: config?.maxEvents || 10000,
      collapseThreshold: config?.collapseThreshold || 480,
    };
  }

  // Navigation methods
  goToStep(stepNumber: number): void {
    const events = this.eventLogger.getEvents();
    if (stepNumber < 0 || stepNumber >= events.length) return;

    // Cache end state if not already cached
    if (!this.endStateCache) {
      this.endStateCache = this.store.getState();
    }

    // Reconstruct state at target step
    const stateAtStep = this.reconstructState(stepNumber);
    this.store.dispatch({ type: 'SET_WORLD_STATE', state: stateAtStep });

    this.pointer = stepNumber;
  }

  stepForward(): void {
    this.goToStep(this.pointer + 1);
  }

  stepBackward(): void {
    this.goToStep(this.pointer - 1);
  }

  goToStart(): void {
    this.goToStep(0);
  }

  goToEnd(): void {
    const events = this.eventLogger.getEvents();
    this.goToStep(events.length - 1);
  }

  // State reconstruction
  private reconstructState(targetStep: number): WorldState {
    const events = this.eventLogger.getEvents();
    // Start from initial world (before any events)
    let state = this.getInitialState();

    for (let i = 0; i <= targetStep; i++) {
      state = this.reducer(state, events[i].action);
    }

    return state;
  }

  // History truncation
  truncateHistory(currentStep: number): void {
    const events = this.eventLogger.getEvents();
    const eventsToKeep = events.slice(0, currentStep + 1);
    this.eventLogger.setEvents(eventsToKeep);
  }

  // Event limit enforcement
  enforceLimit(): void {
    const events = this.eventLogger.getEvents();
    if (events.length > this.config.maxEvents) {
      const eventsToCollapse = events.slice(0, this.config.collapseThreshold);
      const collapsedState = this.reconstructState(this.config.collapseThreshold - 1);
      const collapsedEvent = {
        action: { type: 'SET_WORLD_STATE', state: collapsedState },
        timestamp: eventsToCollapse[0].timestamp,
        step: 0,
      };

      const remainingEvents = events.slice(this.config.collapseThreshold);
      this.eventLogger.setEvents([collapsedEvent, ...remainingEvents]);
    }
  }

  // Clear cache and restore end state
  restoreEndState(): void {
    if (this.endStateCache) {
      this.store.dispatch({ type: 'SET_WORLD_STATE', state: this.endStateCache });
      this.endStateCache = null;
    }
  }
}
```

### Phase 5: Store Integration

**Modify `store/store.ts`**

- Add TimelineManager to Store class:

  ```typescript
  export class Store {
    private timelineManager: TimelineManager | null = null;

    constructor() {
      // ... existing initialization
    }

    setTimelineManager(manager: TimelineManager): void {
      this.timelineManager = manager;
    }

    // Override dispatch to enforce event limit
    dispatch(action: Action, step?: number) {
      // ... existing dispatch logic

      if (this.timelineManager) {
        this.timelineManager.enforceLimit();
      }
    }
  }
  ```

### Phase 6: Event Logger Enhancements

**Modify `store/persistence.ts`**

- Add methods for timeline support:

  ```typescript
  getEvents(): TimelineEvent[] {
    const events = localStorage.getItem('outside-game-events');
    return events ? JSON.parse(events) : [];
  }

  setEvents(events: TimelineEvent[]): void {
    localStorage.setItem('outside-game-events', JSON.stringify(events));
  }

  getEventsUpTo(step: number): TimelineEvent[] {
    const allEvents = this.getEvents();
    return allEvents.filter(event => event.step <= step);
  }
  ```

## Checklist

- [ ] Create timeline types (TimelineEvent, TimelineConfig, TimelineState)
- [ ] Create PlaybackState enum
- [ ] Update Event interface to include step parameter
- [ ] Add originalValue extraction to command handlers
- [ ] Create TimelineManager class with all navigation methods
- [ ] Implement state reconstruction logic
- [ ] Implement history truncation
- [ ] Implement 10,000 step limit with event collapse
- [ ] Add end state caching
- [ ] Integrate TimelineManager with Store
- [ ] Enhance EventLogger with timeline methods
- [ ] Test timeline navigation (forward, backward, jump to start/end)
- [ ] Test state reconstruction accuracy
- [ ] Test event collapse logic
- [ ] Update pitches index

## Success Metrics

- Timeline pointer can navigate to any step in history
- State reconstruction produces correct world state at any step
- Original values enable efficient backward navigation
- End state cache provides instant return to current time
- 10,000 step limit enforced with event collapse
- No memory leaks from long timeline sessions

## Notes

- Timeline pointer does not delete events from history
- OriginalValue is critical for efficient backward navigation
- Event collapse is a form of garbage collection for old events
- End state cache is cleared when taking action from past (truncateHistory)
- This engine provides foundation for all UI, keystroke, and network features

## Related Pitches

- **Prerequisite**: [Keystroke Help Menu (Timeline series: 1)](../../pitches/keystroke-help-menu.md)
- **Next**: [Playback Controls & Game Loop Integration (Timeline series: 3)](../../pitches/timeline-playback-controls.md)
