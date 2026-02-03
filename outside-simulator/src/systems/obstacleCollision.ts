/**
 * Obstacle collision: runs every 2 tics; detects mover–obstacle overlap,
 * pushes circle out along wall normal and bounces direction. No checkpoint.
 * Collided cooldown prevents re-bounce while moving away.
 * @packageDocumentation
 */

import { query, getComponent, setComponent, addComponent } from 'bitecs';
import {
  Position,
  Size,
  ObstacleSize,
  Direction,
  Speed,
  Collided,
  Obstacle,
} from '../components';
import type { SimulatorWorld } from '../world';

const OBSTACLE_CHECK_INTERVAL = 2;
const PUSH_EPSILON = 1e-6;

function circleAabbOverlap(
  cx: number,
  cy: number,
  radius: number,
  ax: number,
  ay: number,
  aSize: number
): boolean {
  const ax2 = ax + aSize;
  const ay2 = ay + aSize;
  const closestX = Math.max(ax, Math.min(cx, ax2));
  const closestY = Math.max(ay, Math.min(cy, ay2));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

/** Reflect velocity angle off wall normal (from wall toward circle). Returns new angle in radians. */
function reflectAngle(angleRad: number, nx: number, ny: number): number {
  const vx = Math.cos(angleRad);
  const vy = Math.sin(angleRad);
  const len = Math.hypot(nx, ny) || 1;
  const nxi = nx / len;
  const nyi = ny / len;
  const dot = vx * nxi + vy * nyi;
  const rx = vx - 2 * dot * nxi;
  const ry = vy - 2 * dot * nyi;
  return Math.atan2(ry, rx);
}

export function obstacleCollisionSystem(world: SimulatorWorld): SimulatorWorld {
  const ticCount = world.ticCount ?? 0;

  // Every tic: decrement Collided cooldown for all entities that have it
  const withCollided = query(world, [Collided]);
  for (let i = 0; i < withCollided.length; i++) {
    const eid = withCollided[i];
    const rem = Collided.ticksRemaining[eid] ?? 0;
    Collided.ticksRemaining[eid] = Math.max(0, rem - 1);
  }

  if (ticCount % OBSTACLE_CHECK_INTERVAL !== 0) {
    return world;
  }

  const movers = query(world, [Position, ObstacleSize, Direction]);
  const obstacles = query(world, [Position, Size, Obstacle]);

  for (let i = 0; i < movers.length; i++) {
    const eid = movers[i];
    const pos = getComponent(world, eid, Position);
    const dir = getComponent(world, eid, Direction);
    const obstacleSize = getComponent(world, eid, ObstacleSize);
    const radius = (obstacleSize?.diameter ?? 0) / 2;

    for (let j = 0; j < obstacles.length; j++) {
      const obsEid = obstacles[j];
      if (obsEid === eid) continue;
      const obsPos = getComponent(world, obsEid, Position);
      const obsSize = getComponent(world, obsEid, Size);
      const cellSize = obsSize?.diameter ?? 1;
      const closestX = Math.max(obsPos.x, Math.min(pos.x, obsPos.x + cellSize));
      const closestY = Math.max(obsPos.y, Math.min(pos.y, obsPos.y + cellSize));
      if (
        !circleAabbOverlap(
          pos.x,
          pos.y,
          radius,
          obsPos.x,
          obsPos.y,
          cellSize
        )
      ) {
        continue;
      }

      const nx = pos.x - closestX;
      const ny = pos.y - closestY;
      const len = Math.hypot(nx, ny) || 1;
      const nxi = nx / len;
      const nyi = ny / len;

      // Skip response if mover has cooldown and is moving away from wall
      const collidedComp = getComponent(world, eid, Collided);
      const ticksRem = collidedComp?.ticksRemaining ?? 0;
      const vx = Math.cos(dir.angle);
      const vy = Math.sin(dir.angle);
      const movingAway = vx * nxi + vy * nyi > 0;
      if (ticksRem > 0 && movingAway) {
        break;
      }

      // Push out along normal so circle is outside AABB
      const dist = Math.hypot(pos.x - closestX, pos.y - closestY);
      const pushOut = radius + PUSH_EPSILON - dist;
      if (pushOut > 0) {
        const newX = pos.x + nxi * pushOut;
        const newY = pos.y + nyi * pushOut;
        setComponent(world, eid, Position, { x: newX, y: newY });
      }

      const newAngle = reflectAngle(dir.angle, nx, ny);
      setComponent(world, eid, Direction, { angle: newAngle });

      const speed = getComponent(world, eid, Speed);
      if (speed?.tilesPerSec != null && speed.tilesPerSec > 0) {
        setComponent(world, eid, Speed, {
          tilesPerSec: speed.tilesPerSec * 0.5,
        });
      }

      addComponent(world, eid, Collided);
      Collided.ticksRemaining[eid] = OBSTACLE_CHECK_INTERVAL;
      addComponent(world, obsEid, Collided);
      Collided.ticksRemaining[obsEid] = OBSTACLE_CHECK_INTERVAL;
      break;
    }
  }

  return world;
}
