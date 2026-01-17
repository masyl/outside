import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineManager } from './manager';
import { Store } from '../store/store';
import { EventLogger } from '../store/persistence';
import { createWorldState, WorldState } from '@outside/core';
import { actions } from '../store/actions';
import { PlaybackState } from './playbackState';

// Mock EventLogger to control event history for testing
class MockEventLogger {
  private events: any[] = [];

  logEvent(action: any, worldState?: WorldState, step?: number) {
    this.events.push({ action, worldState, step: step ?? this.events.length });
  }

  getEventsUpTo(step: number) {
    return this.events.filter((event) => event.step <= step);
  }

  setEvents(events: any[]) {
    this.events = events;
  }

  loadEvents() {
    return this.events;
  }

  getAllEvents() {
    return this.events;
  }
}

describe('TimelineManager', () => {
  let store: Store;
  let eventLogger: MockEventLogger;
  let timelineManager: TimelineManager;
  let initialState: WorldState;

  beforeEach(() => {
    // Create fresh instances for each test
    store = new Store();
    eventLogger = new MockEventLogger();
    // Inject mock logger into store
    (store as any).eventLogger = eventLogger;
    store.start();
    timelineManager = new TimelineManager(store, eventLogger as any);
    initialState = store.getState();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = timelineManager.getState();

      expect(state.currentStep).toBe(0);
      expect(state.totalSteps).toBe(0);
      expect(state.mode).toBe('normal');
    });

    it('should accept custom configuration', () => {
      const customConfig = { maxEvents: 5000 };
      const customManager = new TimelineManager(store, eventLogger as any, customConfig);

      expect(customManager.getState().totalSteps).toBe(0);
    });

    it('should have correct playback state', () => {
      expect(timelineManager.getPlaybackState()).toBe(PlaybackState.PLAYING);
    });
  });

  describe('Basic Navigation', () => {
    beforeEach(() => {
      // Setup some initial events
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 1, y: 1 }), 1);
      store.dispatch(actions.moveObject('bot-1', 'right', 2, { x: 1, y: 1 }), 2);
    });

    it('should report correct current step', () => {
      expect(timelineManager.getCurrentStep()).toBe(0);
    });

    it('should report correct total steps', () => {
      const state = timelineManager.getState();
      expect(state.totalSteps).toBe(4); // Terrain + Bot + Place + Move
    });
  });

  describe('Step Navigation', () => {
    beforeEach(() => {
      // Create a sequence of events for testing
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 1, y: 1 }), 1);
      store.dispatch(actions.moveObject('bot-1', 'right', 2, { x: 1, y: 1 }), 2);
      store.dispatch(actions.moveObject('bot-1', 'down', 1, { x: 3, y: 1 }), 3);
    });

    it('should navigate to specific steps correctly', () => {
      // Navigate to step 2 (after first move)
      // Events: 0:Terrain(0), 1:Bot(0), 2:Place(1), 3:MoveRight(2), 4:MoveDown(3)
      // Note: dispatch 2nd arg is 'step' passed to eventLogger.
      // But MockEventLogger pushes to array.
      // store.dispatch calls logEvent(action, undefined, step).
      // Mock logger: logEvent(action, state, step) -> events.push({..., step: step ?? length})
      // If we pass step explicitly, it uses it.
      // But multiple events can have same step?
      // The test setup uses explicit steps: 0, 1, 2, 3.
      // If I add terrain at step 0, do I increment others?
      // Or can I have multiple events at step 0?
      // Let's assume steps are strictly increasing for simplicity in original test logic.
      // Or I can just ensure terrain is there.

      // Let's just create terrain at step 0 and keep bot creation at step 0.
      // If MockEventLogger sorts by step or just preserves order.
      // MockEventLogger pushes to array.
      // manager.reconstructState loops i from 0 to targetStep.
      // And events.filter((e) => (e.step ?? i) > targetStep) continue.
      // So if multiple events have step 0, they are all applied for targetStep >= 0.
      
      // Let's re-verify step indices.
      // Terrain: step 0
      // Bot: step 0
      // Place: step 1
      // Move R: step 2
      // Move D: step 3
      
      timelineManager.goToStep(2);
      expect(timelineManager.getCurrentStep()).toBe(2);

      const currentState = store.getState();
      expect(currentState.objects.has('bot-1')).toBe(true);
      const bot = currentState.objects.get('bot-1');
      // At step 2, we have Move R (distance 2) from (1,1) -> (3,1).
      expect(bot?.position).toEqual({ x: 3, y: 1 });
    });

    it('should handle going to step 0', () => {
      timelineManager.goToStep(3); // Go to end first
      timelineManager.goToStep(0);

      expect(timelineManager.getCurrentStep()).toBe(0);
      const currentState = store.getState();

      // At step 0, we should have initial state
      expect(currentState.objects.has('bot-1')).toBe(true);
      const bot = currentState.objects.get('bot-1');
      expect(bot?.position).toEqual({ x: 0, y: 0 }); // Default position
    });

    it('should handle going to final step', () => {
      timelineManager.goToStep(3);

      expect(timelineManager.getCurrentStep()).toBe(3);
      const currentState = store.getState();
      const bot = currentState.objects.get('bot-1');
      expect(bot?.position).toEqual({ x: 3, y: 2 }); // After both moves
    });

    it('should clamp step values within valid range', () => {
      timelineManager.goToStep(-1); // Invalid negative step
      expect(timelineManager.getCurrentStep()).toBe(0);

      timelineManager.goToStep(100); // Step beyond total
      expect(timelineManager.getCurrentStep()).toBe(3); // Expect 3 (last step)
    });

    it('should handle navigation to current step', () => {
      timelineManager.goToStep(2);
      const stateBefore = store.getState();

      timelineManager.goToStep(2); // Same step again
      const stateAfter = store.getState();

      expect(stateBefore).toBe(stateAfter); // Should be same reference
    });
  });

  describe('Forward/Backward Navigation', () => {
    beforeEach(() => {
      // Create a sequence of events
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 1, y: 1 }), 1);
      store.dispatch(actions.moveObject('bot-1', 'right', 2, { x: 1, y: 1 }), 2);
    });

    // Helper methods to test navigation capabilities
    const canGoForward = (manager: TimelineManager) => {
      const state = manager.getState();
      return state.currentStep < state.totalSteps - 1;
    };

    const canGoBackward = (manager: TimelineManager) => {
      return manager.getCurrentStep() > 0;
    };

    it('should go forward one step at a time', () => {
      expect(canGoForward(timelineManager)).toBe(true);

      timelineManager.stepForward();
      expect(timelineManager.getCurrentStep()).toBe(1);

      timelineManager.stepForward();
      expect(timelineManager.getCurrentStep()).toBe(2);

      expect(canGoForward(timelineManager)).toBe(false);
    });

    it('should go backward one step at a time', () => {
      timelineManager.goToStep(2); // Go to end first

      expect(canGoBackward(timelineManager)).toBe(true);

      timelineManager.stepBackward();
      expect(timelineManager.getCurrentStep()).toBe(1);

      timelineManager.stepBackward();
      expect(timelineManager.getCurrentStep()).toBe(0);

      expect(canGoBackward(timelineManager)).toBe(false);
    });

    it('should handle forward navigation at end', () => {
      timelineManager.goToStep(2);
      expect(canGoForward(timelineManager)).toBe(false);

      timelineManager.stepForward(); // Should do nothing
      expect(timelineManager.getCurrentStep()).toBe(2);
    });

    it('should handle backward navigation at start', () => {
      expect(canGoBackward(timelineManager)).toBe(false);

      timelineManager.stepBackward(); // Should do nothing
      expect(timelineManager.getCurrentStep()).toBe(0);
    });
  });

  describe('State Reconstruction', () => {
    it('should accurately reconstruct state from event history', () => {
      // Create complex event sequence
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.createBot('bot-2'), 1);
      store.dispatch(actions.placeObject('bot-1', { x: 2, y: 2 }), 2);
      store.dispatch(actions.placeObject('bot-2', { x: 5, y: 3 }), 3);
      store.dispatch(actions.moveObject('bot-1', 'right', 3, { x: 2, y: 2 }), 4);

      // Navigate to different steps and verify state
      timelineManager.goToStep(2);
      let state = store.getState();
      expect(state.objects.size).toBe(2); // Bot-1 and Bot-2 created
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 2, y: 2 });
      expect(state.objects.get('bot-2')?.position).toEqual({ x: 0, y: 0 }); // Default

      timelineManager.goToStep(4);
      state = store.getState();
      expect(state.objects.size).toBe(2);
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 5, y: 2 });
      expect(state.objects.get('bot-2')?.position).toEqual({ x: 5, y: 3 });
    });

    it('should handle state reconstruction with terrain', () => {
      store.dispatch(actions.createTerrain('terrain-1', 'grass', 5, 5, 2, 2), 0);
      store.dispatch(actions.createBot('bot-1'), 1);
      store.dispatch(actions.placeObject('bot-1', { x: 6, y: 6 }), 2);

      timelineManager.goToStep(0);
      let state = store.getState();
      expect(state.groundLayer.terrainObjects.size).toBe(1);
      expect(state.objects.size).toBe(0);

      timelineManager.goToStep(2);
      state = store.getState();
      expect(state.groundLayer.terrainObjects.size).toBe(1);
      expect(state.objects.size).toBe(1);
      expect(state.objects.get('bot-1')?.position).toEqual({ x: 6, y: 6 });
    });

    it('should maintain world properties during reconstruction', () => {
      const originalSeed = initialState.seed;
      const originalWidth = initialState.width;
      const originalHeight = initialState.height;

      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.setWorldSize(25, 15), 1);

      timelineManager.goToStep(0);
      let state = store.getState();
      expect(state.seed).toBe(originalSeed);
      expect(state.width).toBe(originalWidth);
      expect(state.height).toBe(originalHeight);

      timelineManager.goToStep(1);
      state = store.getState();
      expect(state.seed).toBe(originalSeed);
      expect(state.width).toBe(25);
      expect(state.height).toBe(15);
    });
  });

  describe('State Caching', () => {
    beforeEach(() => {
      // Create a sequence of events for caching tests
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 1, y: 1 }), 1);
      store.dispatch(actions.moveObject('bot-1', 'right', 2, { x: 1, y: 1 }), 2);
    });

    it('should cache states for performance', () => {
      // First navigation should compute and cache
      timelineManager.goToStep(2);
      const stateFirst = store.getState();

      // Second navigation to same step should return cached state
      timelineManager.goToStep(0);
      timelineManager.goToStep(2);
      const stateSecond = store.getState();

      // Should be same reference (cached)
      expect(stateFirst).toBe(stateSecond);
    });

    it('should handle multiple navigation steps efficiently', () => {
      timelineManager.stepForward();
      expect(timelineManager.getCurrentStep()).toBe(1);

      timelineManager.stepForward();
      expect(timelineManager.getCurrentStep()).toBe(2);

      timelineManager.stepBackward();
      expect(timelineManager.getCurrentStep()).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty event history', () => {
      const emptyLogger = new MockEventLogger();
      const emptyManager = new TimelineManager(store, emptyLogger as any);

      expect(emptyManager.getCurrentStep()).toBe(0);
      expect(emptyManager.getState().totalSteps).toBe(0);

      emptyManager.stepForward();
      emptyManager.stepBackward();
      emptyManager.goToStep(5);

      expect(emptyManager.getCurrentStep()).toBe(0);
    });

    it('should handle invalid step values gracefully', () => {
      store.dispatch(actions.createBot('bot-1'), 0);

      timelineManager.goToStep(NaN);
      expect(timelineManager.getCurrentStep()).toBe(0);

      timelineManager.goToStep(Infinity);
      expect(timelineManager.getCurrentStep()).toBe(0);

      timelineManager.goToStep(-Infinity);
      expect(timelineManager.getCurrentStep()).toBe(0);
    });

    it('should handle goToStart and goToEnd methods', () => {
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 5, y: 5 }), 1);

      timelineManager.goToEnd();
      expect(timelineManager.getCurrentStep()).toBe(1);

      timelineManager.goToStart();
      expect(timelineManager.getCurrentStep()).toBe(0);
    });
  });

  describe('Integration with Store', () => {
    it('should update store state when navigating', () => {
      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      store.dispatch(actions.placeObject('bot-1', { x: 5, y: 5 }), 1);

      timelineManager.goToStep(1);

      // Store should reflect timeline state
      const storeState = store.getState();
      expect(storeState.objects.get('bot-1')?.position).toEqual({ x: 5, y: 5 });
    });

    it('should handle store events during timeline navigation', () => {
      const mockSubscriber = vi.fn();
      store.subscribe(mockSubscriber);

      store.dispatch(actions.createTerrain('ground', 'grass', 0, 0, 20, 10), 0);
      store.dispatch(actions.createBot('bot-1'), 0);
      timelineManager.goToStep(0);

      // Subscriber should be called when timeline updates store
      expect(mockSubscriber).toHaveBeenCalled();
    });
  });

  describe('State Change Callbacks', () => {
    it('should register and notify state change callbacks', () => {
      // Add a dummy event so navigation works
      store.dispatch(actions.createBot('bot-1'), 0);

      const mockCallback = vi.fn();
      timelineManager.onStateChange(mockCallback);

      timelineManager.goToStep(0);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle multiple callbacks', () => {
      // Add a dummy event
      store.dispatch(actions.createBot('bot-1'), 0);

      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      timelineManager.onStateChange(mockCallback1);
      timelineManager.onStateChange(mockCallback2);

      timelineManager.goToStep(0);

      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
    });
  });
});
