/**
 * Event queue API: parent drains events between ticks.
 * @packageDocumentation
 */

import type { SimulatorWorld } from './world';
import type { SimulatorEvent } from './events';

/**
 * Returns the current event queue (reference). Does not clear it.
 * Parent can read events and then call drainEventQueue to clear.
 *
 * @param world - Simulator world
 * @returns The event queue array (mutated during runTics)
 */
export function getEventQueue(world: SimulatorWorld): SimulatorEvent[] {
  return world.eventQueue;
}

/**
 * Drains the event queue: returns a copy of current events and clears the queue.
 * Call between runTics() calls to process events without mid-loop interruption.
 *
 * @param world - Simulator world
 * @returns Copy of events that were in the queue; queue is now empty
 */
export function drainEventQueue(world: SimulatorWorld): SimulatorEvent[] {
  const events = [...world.eventQueue];
  world.eventQueue.length = 0;
  return events;
}
