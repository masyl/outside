/**
 * Collision system: detects overlap between entities, pushes events to the queue,
 * and adds Collided cooldown to both. Skips pair if both have cooldown and are moving away.
 * @packageDocumentation
 */

import { query, getComponent, setComponent, addComponent } from 'bitecs';
import { Position, ObstacleSize, Speed, Direction, Collided } from '../components';
import type { SimulatorWorld } from '../world';
import type { CollisionEvent } from '../events';

/** Cooldown tics after collision (same as obstacle check interval). */
const COLLIDED_COOLDOWN_TICS = 2;

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** Only mobile entities (Position + ObstacleSize + Speed + Direction) collide; uses obstacle size for overlap. */
export function collisionSystem(world: SimulatorWorld): SimulatorWorld {
  const ents = query(world, [Position, ObstacleSize, Speed, Direction]);
  const queue = world.eventQueue;

  for (let i = 0; i < ents.length; i++) {
    for (let j = i + 1; j < ents.length; j++) {
      const a = ents[i];
      const b = ents[j];
      const posA = getComponent(world, a, Position);
      const posB = getComponent(world, b, Position);
      const sizeA = getComponent(world, a, ObstacleSize);
      const sizeB = getComponent(world, b, ObstacleSize);
      const dist = distance(posA.x, posA.y, posB.x, posB.y);
      const radiusA = sizeA.diameter / 2;
      const radiusB = sizeB.diameter / 2;
      if (dist >= radiusA + radiusB) continue;

      const dirA = getComponent(world, a, Direction);
      const dirB = getComponent(world, b, Direction);
      const speedA = getComponent(world, a, Speed).tilesPerSec;
      const speedB = getComponent(world, b, Speed).tilesPerSec;
      const vAx = Math.cos(dirA.angle) * speedA;
      const vAy = Math.sin(dirA.angle) * speedA;
      const vBx = Math.cos(dirB.angle) * speedB;
      const vBy = Math.sin(dirB.angle) * speedB;
      const movingAway =
        (vAx - vBx) * (posA.x - posB.x) + (vAy - vBy) * (posA.y - posB.y) > 0;

      const ticksA = Collided.ticksRemaining[a] ?? 0;
      const ticksB = Collided.ticksRemaining[b] ?? 0;
      if (ticksA > 0 && ticksB > 0 && movingAway) continue;

      const event: CollisionEvent = { type: 'collision', entityA: a, entityB: b };
      queue.push(event);

      if (speedA > 0) {
        setComponent(world, a, Speed, { tilesPerSec: speedA * 0.5 });
      }
      if (speedB > 0) {
        setComponent(world, b, Speed, { tilesPerSec: speedB * 0.5 });
      }

      addComponent(world, a, Collided);
      Collided.ticksRemaining[a] = COLLIDED_COOLDOWN_TICS;
      addComponent(world, b, Collided);
      Collided.ticksRemaining[b] = COLLIDED_COOLDOWN_TICS;
    }
  }

  return world;
}
