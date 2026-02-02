/**
 * RandomWalk system: updates direction and speed from RNG for next tic.
 * @packageDocumentation
 */

import { query, setComponent } from 'bitecs';
import { Position, Direction, Speed, RandomWalk } from '../components';
import type { SimulatorWorld } from '../world';

/** Min/max speed in tiles per second for randomWalk */
const SPEED_MIN = 0.5;
const SPEED_MAX = 2.0;

export function randomWalkSystem(world: SimulatorWorld): SimulatorWorld {
  const rng = world.random;
  const ents = query(world, [Position, Direction, Speed, RandomWalk]);

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i];
    const angle = rng.nextFloat() * Math.PI * 2;
    const tilesPerSec =
      SPEED_MIN + rng.nextFloat() * (SPEED_MAX - SPEED_MIN);
    setComponent(world, eid, Direction, { angle });
    setComponent(world, eid, Speed, { tilesPerSec });
  }

  return world;
}
