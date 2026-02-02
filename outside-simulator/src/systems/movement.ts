/**
 * Movement system: applies speed × direction for one tic using fixed step.
 * @packageDocumentation
 */

import { query, getComponent, setComponent } from 'bitecs';
import { distancePerTic, stepPosition } from '@outside/utils';
import { Position, Direction, Speed } from '../components';
import type { SimulatorWorld } from '../world';

export function movementSystem(world: SimulatorWorld): SimulatorWorld {
  const ticDurationMs = world.ticDurationMs;
  const ents = query(world, [Position, Direction, Speed]);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const pos = getComponent(world, eid, Position);
    const dir = getComponent(world, eid, Direction);
    const speed = getComponent(world, eid, Speed);
    const distance = distancePerTic(speed.tilesPerSec, ticDurationMs);
    const next = stepPosition(
      { x: pos.x, y: pos.y },
      dir.angle,
      distance
    );
    setComponent(world, eid, Position, { x: next.x, y: next.y });
  }

  return world;
}
