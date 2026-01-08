import { enableMapSet } from 'immer';
import { WorldState, createWorldState } from '@outside/core';
import { Action } from './actions';
import { reducer } from './reducers';

// Enable MapSet plugin for Immer to support Map in state
enableMapSet();

type Subscriber = (state: WorldState) => void;

/**
 * Flux store for managing game state
 */
export class Store {
  private state: WorldState;
  private subscribers: Set<Subscriber> = new Set();

  constructor(initialState?: WorldState) {
    this.state = initialState || createWorldState();
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
  dispatch(action: Action): void {
    const newState = reducer(this.state, action);
    
    // Only update if state actually changed
    if (newState !== this.state) {
      this.state = newState;
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
      subscriber(this.state);
    });
  }
}
