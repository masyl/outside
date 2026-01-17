import { Action } from './actions';
import { Store } from './store';

const STORAGE_KEY = 'outside-game-events';
const STEP_COUNT_KEY = 'outside-game-step-count';

/**
 * Event logger for persisting game state changes to localStorage
 */
export class EventLogger {
  /**
   * Check if an action should be persisted
   * Filters out initial setup actions that should not be replayed
   */
  private shouldPersistAction(action: Action): boolean {
    // Don't persist SET_WORLD_STATE (full state replacement)
    if (action.type === 'SET_WORLD_STATE') {
      return false;
    }

    // Don't persist CREATE_TERRAIN (initial terrain setup)
    // Update: We DO want to persist CREATE_TERRAIN for timeline reconstruction
    // if (action.type === 'CREATE_TERRAIN') {
    //   return false;
    // }

    // Persist all other actions (CREATE_BOT, PLACE_OBJECT, MOVE_OBJECT)
    return true;
  }

  /**
   * Log an event to localStorage
   */
  logEvent(action: Action, timestamp: number = Date.now(), step?: number): void {
    if (!this.shouldPersistAction(action)) {
      return;
    }

    // #region agent log
    // fetch('http://127.0.0.1:7243/ingest/c24317a8-1790-427d-a3bc-82c53839c989',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'persistence.ts:logEvent',message:'Logging event',data:{type:action.type,hasStep:step !== undefined,stepValue:step},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    try {
      const events = this.loadEvents();
      events.push({
        action,
        timestamp,
        step, // Save optional step number
      });

      // Store events array in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      // Handle localStorage errors (e.g., quota exceeded)
      console.warn('[EventLogger] Failed to persist event:', error);
    }
  }

  /**
   * Load all events from localStorage
   */
  loadEvents(): Array<{ action: Action; timestamp: number; step?: number }> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const events = JSON.parse(stored);
      // Validate that it's an array
      if (!Array.isArray(events)) {
        console.warn('[EventLogger] Invalid event format in localStorage, clearing');
        this.clearEvents();
        return [];
      }

      return events;
    } catch (error) {
      console.warn('[EventLogger] Failed to load events:', error);
      return [];
    }
  }

  /**
   * Get events up to a specific step (for timeline navigation)
   */
  getEventsUpTo(step: number): Array<{ action: Action; timestamp: number; step?: number }> {
    const allEvents = this.loadEvents();
    return allEvents.filter((event) => {
      const eventStep = (event as any).step;
      return eventStep !== undefined && eventStep <= step;
    });
  }

  /**
   * Set events array (for timeline history truncation)
   */
  setEvents(events: Array<{ action: Action; timestamp: number; step?: number }>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.warn('[EventLogger] Failed to set events:', error);
    }
  }

  /**
   * Clear all events from localStorage
   */
  clearEvents(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_COUNT_KEY);
    } catch (error) {
      console.warn('[EventLogger] Failed to clear events:', error);
    }
  }

  /**
   * Save step count to localStorage
   */
  saveStepCount(step: number): void {
    try {
      localStorage.setItem(STEP_COUNT_KEY, step.toString());
    } catch (error) {
      console.warn('[EventLogger] Failed to save step count:', error);
    }
  }

  /**
   * Load step count from localStorage
   */
  loadStepCount(): number {
    try {
      const stored = localStorage.getItem(STEP_COUNT_KEY);
      if (!stored) {
        return 0;
      }
      return parseInt(stored, 10) || 0;
    } catch (error) {
      console.warn('[EventLogger] Failed to load step count:', error);
      return 0;
    }
  }

  /**
   * Replay events to rebuild state
   * This dispatches events to the store without logging them again
   *
   * @param store The store to replay events into
   * @param events The events to replay
   * @param onReplayComplete Optional callback called after replay completes
   */
  replayEvents(
    store: Store,
    events: Array<{ action: Action; timestamp: number }>,
    onReplayComplete?: () => void
  ): void {
    console.log(`[EventLogger] Replaying ${events.length} events to restore state`);

    // Temporarily disable logging during replay to prevent infinite loops
    const wasStarted = store.isStarted();
    if (wasStarted) {
      store.stop(); // Stop logging during replay
    }

    try {
      for (const { action } of events) {
        store.dispatch(action);
      }
    } finally {
      // Restore logging state after replay
      if (wasStarted) {
        store.start();
      }
    }

    console.log('[EventLogger] Event replay complete');

    // Call completion callback if provided
    if (onReplayComplete) {
      onReplayComplete();
    }
  }
}
