import { enableMapSet } from 'immer';
import { WorldState, createWorldState } from '@outside/core';
import { Action } from './actions';
import { reducer } from './reducers';
import { EventLogger } from './persistence';

// Enable MapSet plugin for Immer to support Map in state
enableMapSet();

type Subscriber = (state: WorldState) => void;

export class Store {
  private state: WorldState;
  private subscribers: Set<Subscriber> = new Set();
  private isStartedFlag: boolean = false;
  private eventLogger: EventLogger;

  constructor(initialState?: WorldState) {
    this.state = initialState || createWorldState();
    this.eventLogger = new EventLogger();
  }

  setTimelineManager(manager: any): void {
    // Timeline manager will be stored for later access
    // This is a temporary storage - proper dependency injection would be better
    (this as any).timelineManager = manager;
  }

  /**
   * Get current state
   */
  getState(): WorldState {
    return this.state;
  }

  /**
   * Dispatch an action to update state
   */
  dispatch(action: Action, step?: number): void {
    const newState = reducer(this.state, action);

    // Only update if state actually changed
    if (newState !== this.state) {
      this.state = newState;

      // Log event if game has started
      if (this.isStartedFlag) {
        this.eventLogger.logEvent(action, undefined, step);
      }

      // Notify all subscribers
      this.notifySubscribers();
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error('[Store] Error in subscriber:', error);
      }
    });
  }

  /**
   * Mark game as started - enables event logging
   */
  start(): void {
    this.isStartedFlag = true;
  }

  /**
   * Stop event logging (used during replay to prevent infinite loops)
   */
  stop(): void {
    this.isStartedFlag = false;
  }

  /**
   * Check if game has started
   */
  isStarted(): boolean {
    return this.isStartedFlag;
  }

  /**
   * Get event logger instance (for loading/replaying events)
   */
  getEventLogger(): EventLogger {
    return this.eventLogger;
  }
}
