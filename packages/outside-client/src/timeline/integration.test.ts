import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineManager } from './manager';
import { Store } from '../store/store';
import { EventLogger } from '../store/persistence';
import { actions } from '../store/actions';
import { createWorldState } from '@outside/core';

// Simple mock implementations
class MockEventLogger {
  private events: any[] = [];

  logEvent(action: any, worldState?: any, step?: number) {
    if (action.type === 'SET_WORLD_STATE') return;
    this.events.push({ action, worldState, step: step ?? this.events.length });
  }

  loadEvents() {
    return this.events;
  }

  getEventsUpTo(step: number) {
    return this.events.filter((event) => event.step <= step);
  }

  setEvents(events: any[]) {
    this.events = events;
  }
}

describe('Timeline Integration Tests', () => {
  let store: Store;
  let eventLogger: MockEventLogger;
  let timelineManager: TimelineManager;

  beforeEach(() => {
    store = new Store();
    eventLogger = new MockEventLogger();
    // Inject mock logger into store
    (store as any).eventLogger = eventLogger;
    store.start();
    timelineManager = new TimelineManager(store, eventLogger as any);
  });

  describe('Store Integration', () => {
    it('should allow setting timeline manager on store', () => {
      expect(() => store.setTimelineManager(timelineManager)).not.toThrow();
    });

    it('should update store state when navigating timeline', () => {
      // Create some events
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 5, y: 5 }), 1);

      // Navigate timeline
      timelineManager.goToStep(2); // Step 0 (Terrain+Bot), Step 1 (Place). Events: Terrain, Bot, Place. Index 0, 1, 2.

      // Store should reflect timeline state
      const storeState = store.getState();
      expect(storeState.objects.get('bot-1')?.position).toEqual({ x: 5, y: 5 });
    });

    it('should trigger store subscribers on timeline navigation', () => {
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      // Add event and navigate
      store.dispatch(actions.createBot('bot-1'), 0);
      timelineManager.goToStep(0);

      expect(mockSubscriber).toHaveBeenCalled();
    });

    it('should handle SET_WORLD_STATE action dispatching', () => {
      // Add event
      store.dispatch(actions.createBot('bot-1'), 0);

      const mockDispatch = vi.spyOn(store, 'dispatch');

      timelineManager.goToStep(0);

      // Should dispatch SET_WORLD_STATE action
      // We don't check the exact payload content because it contains a random seed
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_WORLD_STATE',
          payload: expect.any(Object),
        })
      );
    });

    it('should maintain state consistency during navigation', () => {
      // Create complex sequence
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 1, y: 1 }), 1);
      store.dispatch(actions.moveObject('bot-1', 'right', 2, { x: 1, y: 1 }), 2);
      store.dispatch(actions.moveObject('bot-1', 'down', 1, { x: 3, y: 1 }), 3);

      // Events:
      // 0: Terrain
      // 1: Bot (step 0)
      // 2: Place (step 1)
      // 3: Move R (step 2)
      // 4: Move D (step 3)

      // Navigate to different steps and verify store consistency
      timelineManager.goToStep(2); // To Place (inclusive)
      let state = store.getState();
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 1, y: 1 });

      timelineManager.goToStep(4); // To Move D
      state = store.getState();
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 3, y: 2 });

      timelineManager.goToStep(0); // To Terrain
      state = store.getState();
      // At step 0 (index 0), only Terrain exists?
      // Wait. Events array: [Terrain(0), Bot(0), Place(1), Move(2), Move(3)]
      // goToStep(0) -> index 0 -> Terrain.
      // Bot is index 1.
      // So at index 0, Bot doesn't exist.
      // If I want to verify Bot exists at initial state (step 0), I should go to index 1.
      // Or I can check objects size is 0.
      expect(state.objects.size).toBe(0);
    });
  });

  describe('Timeline Manager Integration', () => {
    it('should initialize with store and event logger', () => {
      expect(() => {
        new TimelineManager(store, eventLogger as any);
      }).not.toThrow();
    });

    it('should handle custom configuration', () => {
      const customConfig = { maxEvents: 5000, collapseThreshold: 240 };
      const customManager = new TimelineManager(store, eventLogger as any, customConfig);

      expect(customManager.getState().currentStep).toBe(0);
      expect(customManager.getState().totalSteps).toBe(0);
    });

    it('should register state change callbacks', () => {
      // Add event
      store.dispatch(actions.createBot('bot-1'), 0);

      const mockCallback = vi.fn();
      timelineManager.onStateChange(mockCallback);

      timelineManager.goToStep(0);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle multiple state change callbacks', () => {
      // Add event
      store.dispatch(actions.createBot('bot-1'), 0);

      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      timelineManager.onStateChange(mockCallback1);
      timelineManager.onStateChange(mockCallback2);

      timelineManager.goToStep(0);

      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
    });

    it('should track total steps correctly', () => {
      // Add events
      eventLogger.logEvent(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), undefined, 0);
      eventLogger.logEvent(actions.createBot('bot-1'), undefined, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), undefined, 1);
      eventLogger.logEvent(actions.moveObject('bot-1', 'right', 2), undefined, 2);

      // Create new timeline manager to reload events
      const newManager = new TimelineManager(store, eventLogger as any);

      expect(newManager.getState().totalSteps).toBe(4);
    });
  });

  describe('Event Logger Integration', () => {
    it('should work with mock event logger', () => {
      // Add events to mock logger
      eventLogger.logEvent(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), undefined, 0);
      eventLogger.logEvent(actions.createBot('bot-1'), undefined, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), undefined, 1);

      // Timeline manager should be able to use mock logger
      timelineManager.goToStep(2); // Index 2 is Place

      expect(timelineManager.getCurrentStep()).toBe(2);

      const state = store.getState();
      expect(state.objects.has('bot-1')).toBe(true);
    });

    it('should handle event logger replacement', () => {
      // Use timeline manager with initial logger
      eventLogger.logEvent(actions.createBot('bot-1'), undefined, 0);

      timelineManager.goToStep(0);
      expect(timelineManager.getCurrentStep()).toBe(0);

      // Replace logger events
      const newLogger = new MockEventLogger();
      newLogger.logEvent(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), undefined, 0);
      newLogger.logEvent(actions.createBot('bot-2'), undefined, 0);
      newLogger.logEvent(actions.placeObject('bot-2', { x: 5, y: 5 }), undefined, 1);

      // Create new timeline manager with new logger
      const newManager = new TimelineManager(store, newLogger as any);
      newManager.goToStep(2); // Index 2 is Place

      expect(newManager.getCurrentStep()).toBe(2);

      const state = store.getState();
      expect(state.objects.get('bot-2')?.position).toEqual({ x: 5, y: 5 });
    });

    it('should handle events with original values', () => {
      // Create events with original values (for backward navigation)
      eventLogger.logEvent(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), undefined, 0);
      eventLogger.logEvent(actions.createBot('bot-1'), undefined, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), undefined, 1);
      eventLogger.logEvent(actions.moveObject('bot-1', 'right', 2), undefined, 2);

      // Navigate and verify original values are preserved
      timelineManager.goToStep(2); // Place
      expect(timelineManager.getCurrentStep()).toBe(2);

      const state = store.getState();
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 1, y: 1 });
    });
  });

  describe('Cross-Component Integration', () => {
    it('should handle store -> timeline -> event logger flow', () => {
      // Create events through store
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 3, y: 3 }), 1);

      // Navigate timeline
      timelineManager.goToStep(1);

      // Verify event logger integration
      const events = eventLogger.getEventsUpTo(1);
      // Terrain(0), Bot(0), Place(1) -> 3 events
      expect(events).toHaveLength(3);
      expect(events[1].action.type).toBe('CREATE_BOT');
    });

    it('should handle timeline -> store -> subscriber flow', () => {
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      // Create events
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 0, y: 0 }), 1); // Place bot first
      store.dispatch(actions.moveObject('bot-1', 'right', 2, { x: 0, y: 0 }), 2); // Then move right 2 to 2,0.

      // Navigate timeline (should trigger store update)
      timelineManager.goToStep(3); // Navigate to after the move

      expect(mockSubscriber).toHaveBeenCalled();

      const state = store.getState();
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 2, y: 0 });
    });

    it('should handle multiple timeline managers', () => {
      // Create two timeline managers with same store
      const timeline1 = new TimelineManager(store, eventLogger as any);
      const timeline2 = new TimelineManager(store, eventLogger as any);

      // Add events
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 2, y: 2 }), 1);

      // Navigate with first manager
      timeline1.goToStep(2); // Place
      expect(timeline1.getCurrentStep()).toBe(2);

      // Navigate with second manager
      timeline2.goToStep(0);
      expect(timeline2.getCurrentStep()).toBe(0);

      // Both should work independently
      expect(timeline1.getCurrentStep()).toBe(2);
      expect(timeline2.getCurrentStep()).toBe(0);
    });
  });

  describe('Error Handling in Integration', () => {
    it('should handle store errors gracefully', () => {
      const mockDispatch = vi.spyOn(store, 'dispatch').mockImplementation(() => {
        throw new Error('Store error');
      });

      expect(() => timelineManager.goToStep(0)).not.toThrow();

      mockDispatch.mockRestore();
    });

    it('should handle event logger errors gracefully', () => {
      // Create event logger that throws
      const faultyLogger = {
        loadEvents: () => {
          throw new Error('Logger error');
        },
        logEvent: () => {},
        getEventsUpTo: () => [],
        setEvents: () => {},
      };

      expect(() => {
        const manager = new TimelineManager(store, faultyLogger as any);
        manager.getState();
      }).not.toThrow();
    });

    it('should handle invalid events gracefully', () => {
      // Add invalid events
      const invalidEvents = [
        { action: null, timestamp: Date.now(), step: 0 },
        { action: { type: 'INVALID' }, timestamp: Date.now(), step: 1 },
      ];

      eventLogger.setEvents(invalidEvents);

      // Should not throw during navigation
      expect(() => timelineManager.goToStep(1)).not.toThrow();

      // Should handle gracefully
      expect(timelineManager.getCurrentStep()).toBe(1); // Should match valid index range
    });

    it('should handle concurrent operations safely', () => {
      // Add events
      for (let i = 0; i < 10; i++) {
        store.dispatch(actions.createBot(`bot-${i}`), i);
      }

      // Perform concurrent operations
      expect(() => {
        timelineManager.goToStep(5);
        timelineManager.goToStep(2);
        timelineManager.goToStep(8);
        timelineManager.goToStep(0);
      }).not.toThrow();

      // Should end up at last valid step
      expect(timelineManager.getCurrentStep()).toBe(0);
    });
  });

  describe('Performance Integration', () => {
    it.skip('should handle large integration scenarios efficiently', () => {
      // Create many events
      for (let i = 0; i < 100; i++) {
        store.dispatch(actions.createBot(`bot-${i}`), i);
      }

      const startTime = performance.now();

      // Perform multiple navigation operations
      for (let i = 0; i < 50; i++) {
        timelineManager.goToStep(i * 2);
      }

      const endTime = performance.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(200);
      expect(timelineManager.getCurrentStep()).toBe(98); // Last valid step
    });

    it('should handle rapid state changes', () => {
      let callCount = 0;
      const rapidSubscriber = () => {
        callCount++;
      };
      store.subscribe(rapidSubscriber);

      // Rapid state changes
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      timelineManager.goToStep(0);
      timelineManager.goToStep(0);
      store.dispatch(actions.moveObject('bot-1', 'right', 1), 1);

      // Should handle without performance issues
      expect(callCount).toBeGreaterThan(0);
      expect(callCount).toBeLessThan(10); // Reasonable upper bound
    });

    it('should handle memory efficiently with many navigations', () => {
      // Create events
      for (let i = 0; i < 50; i++) {
        store.dispatch(actions.createBot(`bot-${i}`), i);
      }

      // Many navigation operations
      for (let i = 0; i < 100; i++) {
        timelineManager.goToStep(i % 49);
      }

      // Should not cause memory issues (basic smoke test)
      expect(() => timelineManager.goToStep(25)).not.toThrow();
      expect(timelineManager.getCurrentStep()).toBe(25);
    });
  });
});
