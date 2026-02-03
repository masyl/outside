/**
 * Movement system: applies speed × direction for one tic using fixed step.
 * @packageDocumentation
 */

import { query, getComponent, setComponent, addComponent } from 'bitecs';
import { distancePerTic, stepPosition } from '@outside/utils';
import { Position, Direction, Speed, MaxSpeed, PreviousPosition } from '../components';
import type { SimulatorWorld } from '../world';

export function movementSystem(world: SimulatorWorld): SimulatorWorld {
  const ticDurationMs = world.ticDurationMs;
  const ents = query(world, [Position, Direction, Speed]);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const pos = getComponent(world, eid, Position);
    addComponent(world, eid, PreviousPosition);
    setComponent(world, eid, PreviousPosition, { x: pos.x, y: pos.y });
    const dir = getComponent(world, eid, Direction);
    const speed = getComponent(world, eid, Speed);
    let tilesPerSec = speed.tilesPerSec;
    const maxSpeed = getComponent(world, eid, MaxSpeed);
    if (maxSpeed && maxSpeed.tilesPerSec != null) {
      tilesPerSec = Math.min(tilesPerSec, maxSpeed.tilesPerSec);
    }
    const distance = distancePerTic(tilesPerSec, ticDurationMs);
    const next = stepPosition(
      { x: pos.x, y: pos.y },
      dir.angle,
      distance
    );
    setComponent(world, eid, Position, { x: next.x, y: next.y });
  }

  return world;
}
