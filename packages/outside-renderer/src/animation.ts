import { addComponent, hasComponent, query } from 'bitecs';
import {
  Position,
  Direction,
  PreviousPosition,
  FloorTile,
  Food,
} from '@outside/simulator';
import type { RenderWorldState } from './render-world';
import {
  RenderFacing,
  RenderIsMoving,
  RenderLastPosition,
  RenderWalkDistance,
  RenderWalkFrame,
} from './render-components';
import { WALK_CYCLES_PER_TILE, WALK_FRAMES } from './constants';

/**
 * Cardinal facing used by spritesheet row selection.
 */
export type FacingDirection = 'down' | 'left' | 'right' | 'up';

const FACING = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
} as const;

function facingFromVector(dx: number, dy: number, fallback: number): number {
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return fallback;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? FACING.RIGHT : FACING.LEFT;
  }
  return dy >= 0 ? FACING.DOWN : FACING.UP;
}

function facingFromAngle(angle: number, fallback: number): number {
  if (!Number.isFinite(angle)) return fallback;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  return facingFromVector(dx, dy, fallback);
}

/**
 * Computes one renderer animation tick from current world state.
 *
 * @param renderWorld `RenderWorldState` world + renderer-only animation caches.
 * @param nowMs `number` optional timestamp override for deterministic tests.
 */
export function runAnimationTic(renderWorld: RenderWorldState, nowMs: number = Date.now()): void {
  const world = renderWorld.world;
  const previousAnimationTimeMs = renderWorld.lastAnimationTimeMs;
  const elapsedMs =
    previousAnimationTimeMs == null
      ? 0
      : Math.max(0, nowMs - previousAnimationTimeMs);
  renderWorld.lastAnimationTimeMs = nowMs;
  const entities = query(world, [Position]);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    if (hasComponent(world, eid, FloorTile) || hasComponent(world, eid, Food)) {
      continue;
    }

    if (!hasComponent(world, eid, RenderLastPosition)) {
      addComponent(world, eid, RenderLastPosition);
      RenderLastPosition.x[eid] = Position.x[eid];
      RenderLastPosition.y[eid] = Position.y[eid];
    }
    if (!hasComponent(world, eid, RenderWalkDistance)) {
      addComponent(world, eid, RenderWalkDistance);
      RenderWalkDistance.value[eid] = 0;
    }
    if (!hasComponent(world, eid, RenderWalkFrame)) {
      addComponent(world, eid, RenderWalkFrame);
      RenderWalkFrame.index[eid] = 0;
    }
    if (!hasComponent(world, eid, RenderFacing)) {
      addComponent(world, eid, RenderFacing);
      RenderFacing.dir[eid] = FACING.DOWN;
    }
    if (!hasComponent(world, eid, RenderIsMoving)) {
      addComponent(world, eid, RenderIsMoving);
      RenderIsMoving.value[eid] = 0;
    }

    const prevX = Number.isFinite(PreviousPosition.x[eid])
      ? PreviousPosition.x[eid]
      : RenderLastPosition.x[eid];
    const prevY = Number.isFinite(PreviousPosition.y[eid])
      ? PreviousPosition.y[eid]
      : RenderLastPosition.y[eid];
    const dx = Position.x[eid] - prevX;
    const dy = Position.y[eid] - prevY;
    // Euclidean distance gives displacement in tile units independent of axis direction.
    const distance = Math.hypot(dx, dy);
    const isMoving = distance > 0.0001;

    RenderIsMoving.value[eid] = isMoving ? 1 : 0;

    if (isMoving) {
      // Time-based progression keeps walk animation cadence stable when simulation tic throughput changes.
      RenderWalkDistance.value[eid] += elapsedMs;
    }

    const prevFacing = RenderFacing.dir[eid] ?? FACING.DOWN;
    let nextFacing = prevFacing;

    const angle = Direction.angle[eid];
    if (Number.isFinite(angle)) {
      nextFacing = facingFromAngle(angle, prevFacing);
    } else if (isMoving) {
      nextFacing = facingFromVector(dx, dy, prevFacing);
    }

    RenderFacing.dir[eid] = nextFacing;

    if (!isMoving) {
      RenderWalkFrame.index[eid] = 0;
    } else {
      const frameProgress =
        (RenderWalkDistance.value[eid] * WALK_FRAMES * WALK_CYCLES_PER_TILE) / 1000;
      const frame = Math.floor(frameProgress) % WALK_FRAMES;
      RenderWalkFrame.index[eid] = frame < 0 ? frame + WALK_FRAMES : frame;
    }

    RenderLastPosition.x[eid] = Position.x[eid];
    RenderLastPosition.y[eid] = Position.y[eid];
  }
}

/**
 * Returns human-readable facing from cached renderer state.
 *
 * @param renderWorld `RenderWorldState` renderer ECS state.
 * @param eid `number` entity id.
 * @returns `FacingDirection` cardinal facing for spritesheet row selection.
 */
export function getFacingDirection(renderWorld: RenderWorldState, eid: number): FacingDirection {
  const dir = RenderFacing.dir[eid] ?? FACING.DOWN;
  switch (dir) {
    case FACING.LEFT:
      return 'left';
    case FACING.RIGHT:
      return 'right';
    case FACING.UP:
      return 'up';
    case FACING.DOWN:
    default:
      return 'down';
  }
}

/**
 * Returns current walk frame index.
 *
 * @param renderWorld `RenderWorldState` renderer ECS state.
 * @param eid `number` entity id.
 * @returns `number` 0-based walk frame index.
 */
export function getWalkFrame(renderWorld: RenderWorldState, eid: number): number {
  return RenderWalkFrame.index[eid] ?? 0;
}

/**
 * Returns whether the entity moved during the last animation update.
 *
 * @param renderWorld `RenderWorldState` renderer ECS state.
 * @param eid `number` entity id.
 * @returns `boolean` movement flag from the last animation tick.
 */
export function getIsMoving(renderWorld: RenderWorldState, eid: number): boolean {
  return (RenderIsMoving.value[eid] ?? 0) > 0;
}
