/**
 * Collision system: detects overlap between entities and pushes events to the queue.
 * Detection only; no built-in response.
 * @packageDocumentation
 */

import { query, getComponent } from 'bitecs';
import { Position, Size } from '../components';
import type { SimulatorWorld } from '../world';
import type { CollisionEvent } from '../events';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function collisionSystem(world: SimulatorWorld): SimulatorWorld {
  const ents = query(world, [Position, Size]);
  const queue = world.eventQueue;

  for (let i = 0; i < ents.length; i++) {
    for (let j = i + 1; j < ents.length; j++) {
      const a = ents[i];
      const b = ents[j];
      const posA = getComponent(world, a, Position);
      const posB = getComponent(world, b, Position);
      const sizeA = getComponent(world, a, Size);
      const sizeB = getComponent(world, b, Size);
      const dist = distance(posA.x, posA.y, posB.x, posB.y);
      const radiusA = sizeA.diameter / 2;
      const radiusB = sizeB.diameter / 2;
      if (dist < radiusA + radiusB) {
        const event: CollisionEvent = { type: 'collision', entityA: a, entityB: b };
        queue.push(event);
      }
    }
  }

  return world;
}
