import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store } from './store';
import { createWorldState } from '@outside/core';
import { Action } from './actions';

// Mock the EventLogger to avoid filesystem dependencies
vi.mock('./persistence', () => ({
  EventLogger: class MockEventLogger {
    logEvent = vi.fn();
    save = vi.fn();
    load = vi.fn(() => null);
    loadEvents = vi.fn(() => []);
  },
}));

describe('Store Management', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  describe('Basic Store Operations', () => {
    it('should initialize with default world state', () => {
      const state = store.getState();

      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
      expect(state).toHaveProperty('grid');
      expect(state).toHaveProperty('objects');
      expect(state).toHaveProperty('groundLayer');
      expect(state).toHaveProperty('width', 20);
      expect(state).toHaveProperty('height', 10);
      expect(state).toHaveProperty('seed');
    });

    it('should accept initial state', () => {
      const initialState = createWorldState(123);
      const customStore = new Store(initialState);

      const state = customStore.getState();
      expect(state.seed).toBe(123);
    });

    it('should maintain state consistency after operations', () => {
      const initialState = store.getState();
      const initialObjectCount = initialState.objects.size;

      // Add a bot
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });

      const afterState = store.getState();
      expect(afterState.objects.size).toBe(initialObjectCount + 1);
      expect(afterState.objects.has('bot-1')).toBe(true);
    });
  });

  describe('Subscriber Management', () => {
    it('should handle subscriber registration', () => {
      const mockSubscriber1 = vi.fn();
      const mockSubscriber2 = vi.fn();

      const unsubscribe1 = store.subscribe(mockSubscriber1);
      const unsubscribe2 = store.subscribe(mockSubscriber2);

      // Dispatch action to trigger subscribers
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });

      expect(mockSubscriber1).toHaveBeenCalledWith(store.getState());
      expect(mockSubscriber2).toHaveBeenCalledWith(store.getState());

      // Unsubscribe functions should be returned
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
    });

    it('should not notify subscribers on identical state', () => {
      const mockSubscriber = vi.fn();

      store.subscribe(mockSubscriber);

      // Get initial state (this shouldn't trigger subscribers)
      const initialState = store.getState();
      const sameState = store.getState();

      expect(mockSubscriber).not.toHaveBeenCalled();
      expect(initialState).toBe(sameState);
    });

    it('should handle subscriber unregistration', () => {
      const mockSubscriber1 = vi.fn();
      const mockSubscriber2 = vi.fn();

      const unsubscribe1 = store.subscribe(mockSubscriber1);
      store.subscribe(mockSubscriber2);

      // Unregister first subscriber using returned function
      unsubscribe1();

      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });

      expect(mockSubscriber1).not.toHaveBeenCalled();
      expect(mockSubscriber2).toHaveBeenCalled();
    });

    it('should handle concurrent state updates safely', () => {
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      // Simulate rapid concurrent updates
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-2' } });
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-3' } });

      expect(mockSubscriber).toHaveBeenCalledTimes(3);

      // Verify final state is consistent
      const finalState = store.getState();
      expect(finalState.objects.size).toBe(3);
      expect(finalState.objects.has('bot-1')).toBe(true);
      expect(finalState.objects.has('bot-2')).toBe(true);
      expect(finalState.objects.has('bot-3')).toBe(true);
    });
  });

  describe('Action Dispatching', () => {
    it('should handle unknown action types gracefully', () => {
      const initialState = store.getState();

      // @ts-ignore - intentionally testing unknown action
      store.dispatch({ type: 'UNKNOWN_ACTION', payload: {} } as Action);

      // State should remain unchanged
      const afterState = store.getState();
      expect(afterState).toEqual(initialState);
    });

    it('should handle action payload validation', () => {
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      // Dispatch action with valid payload
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'test-bot' } });

      expect(mockSubscriber).toHaveBeenCalled();
      const state = store.getState();

      // Bot should be created with provided id
      expect(state.objects.has('test-bot')).toBe(true);
    });
  });

  describe('Store Lifecycle', () => {
    it('should track started state correctly', () => {
      expect(store['isStartedFlag']).toBe(false);

      store.start();
      expect(store['isStartedFlag']).toBe(true);

      store.stop();
      expect(store['isStartedFlag']).toBe(false);
    });

    it('should handle start/stop operations safely', () => {
      store.start();
      store.start(); // Should not error
      expect(store['isStartedFlag']).toBe(true);

      store.stop();
      store.stop(); // Should not error
      expect(store['isStartedFlag']).toBe(false);
    });

    it('should persist state changes when started', () => {
      const mockEventLogger = store['eventLogger'];

      store.start();

      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });

      // Verify event logging was called
      expect(mockEventLogger.logEvent).toHaveBeenCalled();
    });

    it('should not persist when not started', () => {
      const mockEventLogger = store['eventLogger'];

      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });

      // Event logging should not have been called
      expect(mockEventLogger.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('State Immutability', () => {
    it('should provide consistent state references', () => {
      const state1 = store.getState();
      const state2 = store.getState();

      // Should be the same reference (getState returns current state)
      expect(state1).toBe(state2);

      // State should contain expected properties
      expect(state1).toHaveProperty('grid');
      expect(state1).toHaveProperty('objects');
      expect(state1).toHaveProperty('width');
      expect(state1).toHaveProperty('height');
      expect(state1).toHaveProperty('seed');
    });

    it('should handle subscriber errors gracefully', () => {
      const errorSubscriber = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalSubscriber = vi.fn();

      store.subscribe(errorSubscriber);
      store.subscribe(normalSubscriber);

      // Dispatch should not fail even with subscriber error
      expect(() => {
        store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });
      }).not.toThrow();

      // Normal subscriber should still be called
      expect(normalSubscriber).toHaveBeenCalled();
    });

    it('should maintain store state after subscriber errors', () => {
      const errorSubscriber = vi.fn(() => {
        throw new Error('Subscriber error');
      });

      store.subscribe(errorSubscriber);

      // Dispatch action
      store.dispatch({ type: 'CREATE_BOT', payload: { id: 'bot-1' } });

      // Store state should still be updated
      const state = store.getState();
      expect(state.objects.has('bot-1')).toBe(true);
    });
  });
});
