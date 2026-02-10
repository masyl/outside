/**
 * Soccer ball prefab: kickable dynamic sphere for physics interactions.
 * @packageDocumentation
 */

import { addComponent, addEntity, setComponent } from 'bitecs';
import { SOCCER_BALL_SPRITE_KEY } from '@outside/resource-packs/soccer-ball/meta';
import {
  Bounciness,
  DefaultSpriteKey,
  Grounded,
  Kickable,
  Obstacle,
  ObstacleSize,
  Observed,
  Position,
  PositionZ,
  Size,
  SoccerBall,
  VariantSpriteKey,
  VelocityZ,
  VisualSize,
} from '../components';
import type { SimulatorWorld } from '../world';

const DEFAULTS = {
  visualDiameter: 0.8,
  obstacleDiameter: 0.6,
  bounciness: 0.9,
  spriteKey: SOCCER_BALL_SPRITE_KEY,
} as const;

export interface SpawnSoccerBallOptions {
  x: number;
  y: number;
  visualDiameter?: number;
  obstacleDiameter?: number;
  bounciness?: number;
  spriteKey?: string;
}

/**
 * Spawns a soccer ball at world position (x, y).
 */
export function spawnSoccerBall(world: SimulatorWorld, options: SpawnSoccerBallOptions): number {
  const visualDiameter = options.visualDiameter ?? DEFAULTS.visualDiameter;
  const obstacleDiameter = options.obstacleDiameter ?? DEFAULTS.obstacleDiameter;
  const radius = Math.max(0.15, obstacleDiameter * 0.5);

  const eid = addEntity(world);
  addComponent(world, eid, Observed);
  addComponent(world, eid, Position);
  setComponent(world, eid, Position, { x: options.x, y: options.y });

  addComponent(world, eid, VisualSize);
  setComponent(world, eid, VisualSize, { diameter: visualDiameter });
  addComponent(world, eid, Size);
  setComponent(world, eid, Size, { diameter: obstacleDiameter });
  addComponent(world, eid, ObstacleSize);
  setComponent(world, eid, ObstacleSize, { diameter: obstacleDiameter });
  addComponent(world, eid, Obstacle);

  addComponent(world, eid, PositionZ);
  setComponent(world, eid, PositionZ, { z: radius });
  addComponent(world, eid, VelocityZ);
  setComponent(world, eid, VelocityZ, { z: 0 });
  addComponent(world, eid, Grounded);
  setComponent(world, eid, Grounded, { value: 1 });

  addComponent(world, eid, Bounciness);
  setComponent(world, eid, Bounciness, {
    value: Math.max(0, Math.min(1, options.bounciness ?? DEFAULTS.bounciness)),
  });
  addComponent(world, eid, SoccerBall);
  addComponent(world, eid, Kickable);

  addComponent(world, eid, DefaultSpriteKey);
  setComponent(world, eid, DefaultSpriteKey, {
    value: options.spriteKey ?? DEFAULTS.spriteKey,
  });
  addComponent(world, eid, VariantSpriteKey);
  setComponent(world, eid, VariantSpriteKey, { value: '' });

  return eid;
}
