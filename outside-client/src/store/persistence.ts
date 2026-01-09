import { Action } from './actions';
import { Store } from './store';

const STORAGE_KEY = 'outside-game-events';

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
    if (action.type === 'CREATE_TERRAIN') {
      return false;
    }
    
    // Persist all other actions (CREATE_BOT, PLACE_OBJECT, MOVE_OBJECT)
    return true;
  }

  /**
   * Log an event to localStorage
   */
  logEvent(action: Action, timestamp: number = Date.now()): void {
    if (!this.shouldPersistAction(action)) {
      return;
    }

    try {
      const events = this.loadEvents();
      events.push({
        action,
        timestamp,
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
  loadEvents(): Array<{ action: Action; timestamp: number }> {
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
   * Clear all events from localStorage
   */
  clearEvents(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[EventLogger] Failed to clear events:', error);
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
