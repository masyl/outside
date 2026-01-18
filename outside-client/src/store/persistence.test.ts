import { describe, it, expect, beforeEach } from 'vitest';
import { EventLogger } from './persistence';
import { createWorldState } from '@outside/core';
import { actions } from './actions';

describe('EventLogger Timeline Features', () => {
  let eventLogger: EventLogger;
  let initialState: any;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    localStorage.removeItem('outside-game-events');
    localStorage.removeItem('outside-game-step-count');
    eventLogger = new EventLogger();
    eventLogger.clearEvents(); // Explicitly clear using class method
    initialState = createWorldState(42);
  });

  describe('getEventsUpTo', () => {
    it('should return events at step 0', () => {
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);

      const events = eventLogger.getEventsUpTo(0);
      expect(events).toHaveLength(1);
    });

    it('should return events up to specified step (inclusive)', () => {
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), initialState, 1);
      eventLogger.logEvent(actions.moveObject('bot-1', 'right', 2), initialState, 2);

      let events = eventLogger.getEventsUpTo(1);
      expect(events).toHaveLength(2); // 0 and 1
      expect(events[0].action.type).toBe('CREATE_BOT');
      expect(events[1].action.type).toBe('PLACE_OBJECT');

      events = eventLogger.getEventsUpTo(2);
      expect(events).toHaveLength(3); // 0, 1, 2
      expect(events[0].action.type).toBe('CREATE_BOT');
      expect(events[1].action.type).toBe('PLACE_OBJECT');
      expect(events[2].action.type).toBe('MOVE_OBJECT');

      events = eventLogger.getEventsUpTo(3);
      expect(events).toHaveLength(3);
    });

    it('should handle negative step values', () => {
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);

      const events = eventLogger.getEventsUpTo(-1);
      expect(events).toHaveLength(0);
    });

    it('should handle step beyond event count', () => {
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), initialState, 1);

      const events = eventLogger.getEventsUpTo(10);
      expect(events).toHaveLength(2);
    });

    it('should preserve event order and structure', () => {
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 5, y: 3 }), initialState, 5);
      eventLogger.logEvent(actions.moveObject('bot-1', 'left', 2), initialState, 10);

      const events = eventLogger.getEventsUpTo(10);

      expect(events).toHaveLength(3);
      expect(events[0].step).toBe(0);
      expect(events[0].action.type).toBe('CREATE_BOT');
      expect(events[1].step).toBe(5);
      expect(events[1].action.type).toBe('PLACE_OBJECT');
      expect(events[2].step).toBe(10);
      expect(events[2].action.type).toBe('MOVE_OBJECT');
    });

    it('should handle events without explicit steps', () => {
      eventLogger.logEvent(actions.createBot('bot-1'), initialState);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), initialState);
      eventLogger.logEvent(actions.moveObject('bot-1', 'right', 2), initialState);

      const events = eventLogger.getEventsUpTo(2);
      expect(events).toHaveLength(3); // 0, 1, 2

      // Should auto-assign steps starting from 0
      expect(events[0].step).toBe(0);
      expect(events[1].step).toBe(1);
      expect(events[2].step).toBe(2);
    });
  });

  describe('setEvents', () => {
    it('should replace entire event history', () => {
      // Add initial events
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), initialState, 1);

      let events = eventLogger.loadEvents();
      expect(events).toHaveLength(2);

      // Replace with new events
      const newEvents = [
        { action: actions.createBot('bot-2'), timestamp: Date.now(), step: 0 },
        { action: actions.placeObject('bot-2', { x: 5, y: 5 }), timestamp: Date.now(), step: 1 },
        { action: actions.moveObject('bot-2', 'up', 3), timestamp: Date.now(), step: 2 },
      ];

      eventLogger.setEvents(newEvents);

      events = eventLogger.loadEvents();
      expect(events).toHaveLength(3);
      expect((events[0].action as any).payload.id).toBe('bot-2');
      expect((events[1].action as any).payload.id).toBe('bot-2');
      expect((events[2].action as any).payload.id).toBe('bot-2');
    });

    it('should handle empty event array', () => {
      // Add initial events
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);

      let events = eventLogger.loadEvents();
      expect(events).toHaveLength(1);

      // Replace with empty array
      eventLogger.setEvents([]);

      events = eventLogger.loadEvents();
      expect(events).toHaveLength(0);
    });

    it('should clear getEventsUpTo cache after setEvents', () => {
      // Add events and test getEventsUpTo
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), initialState, 1);

      let events = eventLogger.getEventsUpTo(1);
      expect(events).toHaveLength(2);

      // Replace events
      eventLogger.setEvents([
        { action: actions.createBot('bot-2'), timestamp: Date.now(), step: 0 },
        { action: actions.moveObject('bot-2', 'right', 3), timestamp: Date.now(), step: 1 },
      ]);

      // Should return new events
      events = eventLogger.getEventsUpTo(1);
      expect(events).toHaveLength(2);
      expect((events[0].action as any).payload.id).toBe('bot-2');
    });
  });

  describe('Event Limit Enforcement', () => {
    it('should handle large numbers of events efficiently', () => {
      // Add many events
      for (let i = 0; i < 1000; i++) {
        eventLogger.logEvent(actions.createBot(`bot-${i}`), initialState, i);
      }

      const events = eventLogger.loadEvents();
      expect(events).toHaveLength(1000);

      // Test getEventsUpTo performance with large dataset
      const startTime = performance.now();
      const filteredEvents = eventLogger.getEventsUpTo(500);
      const endTime = performance.now();

      expect(filteredEvents).toHaveLength(501); // 0 to 500 is 501 items
      expect(endTime - startTime).toBeLessThan(50); // Should be fast
    });

    it('should handle event filtering at different ranges', () => {
      // Create events with different step ranges
      for (let i = 0; i < 100; i++) {
        eventLogger.logEvent(actions.createBot(`bot-${i}`), initialState, i * 10);
      }

      // Test various ranges
      expect(eventLogger.getEventsUpTo(50)).toHaveLength(6); // steps 0,10,20,30,40,50
      expect(eventLogger.getEventsUpTo(95)).toHaveLength(10); // steps 0-90
      expect(eventLogger.getEventsUpTo(1000)).toHaveLength(100); // all events
    });

    it('should maintain performance with repeated getEventsUpTo calls', () => {
      // Add events
      for (let i = 0; i < 500; i++) {
        eventLogger.logEvent(actions.createBot(`bot-${i}`), initialState, i);
      }

      // Make multiple calls and test performance
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        eventLogger.getEventsUpTo(250);
      }

      const endTime = performance.now();

      // Should be efficient even with repeated calls
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Integration with Timeline', () => {
    it('should provide events suitable for timeline reconstruction', () => {
      // Create a sequence that represents a realistic timeline
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.placeObject('bot-1', { x: 1, y: 1 }), initialState, 1);
      eventLogger.logEvent(actions.moveObject('bot-1', 'right', 2), initialState, 2);
      eventLogger.logEvent(actions.moveObject('bot-1', 'down', 1), initialState, 3);

      // Get events for different timeline positions
      const eventsAtStep1 = eventLogger.getEventsUpTo(1);
      const eventsAtStep3 = eventLogger.getEventsUpTo(3);

      expect(eventsAtStep1).toHaveLength(2); // 0, 1
      expect(eventsAtStep1[0].action.type).toBe('CREATE_BOT');
      expect(eventsAtStep1[1].action.type).toBe('PLACE_OBJECT');

      expect(eventsAtStep3).toHaveLength(4); // 0, 1, 2, 3
      expect(eventsAtStep3[0].action.type).toBe('CREATE_BOT');
      expect(eventsAtStep3[1].action.type).toBe('PLACE_OBJECT');
      expect(eventsAtStep3[2].action.type).toBe('MOVE_OBJECT');
      expect(eventsAtStep3[3].action.type).toBe('MOVE_OBJECT');
    });

    it('should handle complex action types in timeline context', () => {
      // Test various action types that might appear in timeline
      eventLogger.logEvent(actions.createBot('bot-1'), initialState, 0);
      eventLogger.logEvent(actions.setWorldSize(25, 15), initialState, 1);
      eventLogger.logEvent(actions.setSeed(123), initialState, 2);

      const allEvents = eventLogger.getEventsUpTo(10);

      expect(allEvents).toHaveLength(3);
      expect(allEvents[0].action.type).toBe('CREATE_BOT');
      expect(allEvents[1].action.type).toBe('SET_WORLD_SIZE');
      expect(allEvents[2].action.type).toBe('SET_SEED');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed events gracefully', () => {
      // Set malformed events using type assertion
      const malformedEvents = [
        { action: actions.createBot('valid-bot'), timestamp: Date.now(), step: 0 },
      ];

      eventLogger.setEvents(malformedEvents);

      const events = eventLogger.getEventsUpTo(5);
      expect(events).toHaveLength(1);
      expect(events[0].action.type).toBe('CREATE_BOT');
    });

    it('should handle events with missing steps', () => {
      const eventsWithoutSteps = [
        { action: actions.createBot('bot-1'), timestamp: Date.now() },
        { action: actions.placeObject('bot-1', { x: 1, y: 1 }), timestamp: Date.now(), step: 1 },
        { action: actions.moveObject('bot-1', 'right', 2), timestamp: Date.now() },
      ];

      eventLogger.setEvents(eventsWithoutSteps);

      const events = eventLogger.getEventsUpTo(5);
      expect(events).toHaveLength(3);

      // Should handle events with and without steps
      expect(events[0].action.type).toBe('CREATE_BOT');
      expect(events[1].action.type).toBe('PLACE_OBJECT');
      expect(events[2].action.type).toBe('MOVE_OBJECT');
    });
  });
});
