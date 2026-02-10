/**
 * Generic commanded path-following API for any entity with Position/Direction/TargetPace.
 * Path state is stored outside ECS and consumed by the path-following system.
 * @packageDocumentation
 */

import {
  addComponent,
  getComponent,
  hasComponent,
  removeComponent,
  setComponent,
} from 'bitecs';
import {
  Direction,
  Position,
  TargetPace,
  Wait,
  Wander,
  WanderPersistence,
} from './components';
import { findPath, getPassableTiles, simplifyPath } from './pathfinding';
import {
  TARGET_PACE_RUNNING,
  TARGET_PACE_STANDING_STILL,
} from './pace';
import type { SimulatorWorld } from './world';

type TileWaypoint = { x: number; y: number };
type PathOrderState = {
  waypoints: TileWaypoint[];
  restoreWander: boolean;
};

const pathOrdersByWorld = new WeakMap<SimulatorWorld, Map<number, PathOrderState>>();

function getPathOrders(world: SimulatorWorld): Map<number, PathOrderState> {
  let orders = pathOrdersByWorld.get(world);
  if (orders == null) {
    orders = new Map();
    pathOrdersByWorld.set(world, orders);
  }
  return orders;
}

/** Distance to waypoint center below which we consider "reached" (tiles). */
const REACHED_THRESHOLD = 0.35;

function angleToward(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

function ensureWanderPersistence(world: SimulatorWorld, eid: number): void {
  if (!hasComponent(world, eid, WanderPersistence)) {
    addComponent(world, eid, WanderPersistence);
    setComponent(world, eid, WanderPersistence, { ticsUntilNextChange: 0 });
  }
}

function resumeAutonomousSteering(world: SimulatorWorld, eid: number): void {
  if (hasComponent(world, eid, Wait)) {
    removeComponent(world, eid, Wait);
  }
  if (!hasComponent(world, eid, Wander)) {
    addComponent(world, eid, Wander);
  }
  ensureWanderPersistence(world, eid);
}

function setStandingPace(world: SimulatorWorld, eid: number): void {
  if (!hasComponent(world, eid, TargetPace)) {
    addComponent(world, eid, TargetPace);
  }
  setComponent(world, eid, TargetPace, { value: TARGET_PACE_STANDING_STILL });
}

function suspendAutonomousSteering(world: SimulatorWorld, eid: number): void {
  if (hasComponent(world, eid, Wait)) {
    removeComponent(world, eid, Wait);
  }
  if (hasComponent(world, eid, Wander)) {
    removeComponent(world, eid, Wander);
  }
}

function setPathDebugTarget(world: SimulatorWorld, eid: number, tileX: number, tileY: number): void {
  ensureWanderPersistence(world, eid);
  setComponent(world, eid, WanderPersistence, {
    targetTileX: tileX,
    targetTileY: tileY,
  });
}

/**
 * Orders an entity to move to a tile using floor-grid pathfinding.
 * Path-following temporarily suspends Wander/Wait and resumes Wander at completion
 * if the entity was previously wandering.
 */
export function orderEntityToTile(
  world: SimulatorWorld,
  eid: number,
  tileX: number,
  tileY: number
): void {
  const pos = getComponent(world, eid, Position);
  if (pos == null) return;
  const from = { x: pos.x, y: pos.y };
  const to = { x: tileX, y: tileY };
  const rawPath = findPath(world, from, to);
  const path = simplifyPath(getPassableTiles(world), rawPath);
  const pathOrders = getPathOrders(world);
  const restoreWander = hasComponent(world, eid, Wander);

  suspendAutonomousSteering(world, eid);
  if (path.length <= 1) {
    pathOrders.delete(eid);
    if (restoreWander) {
      resumeAutonomousSteering(world, eid);
    } else {
      setStandingPace(world, eid);
    }
    return;
  }

  const firstWaypoint = path[1];
  if (firstWaypoint) {
    setPathDebugTarget(world, eid, firstWaypoint.x, firstWaypoint.y);
  }
  pathOrders.set(eid, {
    waypoints: path.slice(1),
    restoreWander,
  });
}

/**
 * Returns the currently queued waypoints for the entity. Empty array if none.
 */
export function getEntityPath(world: SimulatorWorld, eid: number): TileWaypoint[] {
  const pathOrders = getPathOrders(world);
  const order = pathOrders.get(eid);
  return order ? [...order.waypoints] : [];
}

/**
 * Clears any commanded path order for an entity.
 * Restores prior autonomous steering behavior if the order requested it; otherwise stops movement.
 *
 * @returns true when a queued path existed and was cleared.
 */
export function clearEntityPath(world: SimulatorWorld, eid: number): boolean {
  const pathOrders = getPathOrders(world);
  const order = pathOrders.get(eid);
  if (!order) return false;
  pathOrders.delete(eid);
  if (order.restoreWander) {
    resumeAutonomousSteering(world, eid);
  } else {
    setStandingPace(world, eid);
  }
  return true;
}

/**
 * Path-following system: steers entities with queued waypoints toward path[0],
 * consumes checkpoints on arrival, and restores autonomous wander if applicable.
 * Run before urge so path steering wins within the current tic.
 */
export function pathFollowingSystem(world: SimulatorWorld): SimulatorWorld {
  const pathOrders = getPathOrders(world);
  for (const [eid, order] of pathOrders) {
    if (
      !hasComponent(world, eid, Position) ||
      !hasComponent(world, eid, Direction) ||
      !hasComponent(world, eid, TargetPace)
    ) {
      pathOrders.delete(eid);
      continue;
    }
    if (order.waypoints.length === 0) {
      pathOrders.delete(eid);
      if (order.restoreWander) {
        resumeAutonomousSteering(world, eid);
      } else {
        setStandingPace(world, eid);
      }
      continue;
    }

    const pos = getComponent(world, eid, Position);
    const waypoint = order.waypoints[0];
    const centerX = waypoint.x + 0.5;
    const centerY = waypoint.y + 0.5;
    const dist = Math.hypot(centerX - pos.x, centerY - pos.y);
    if (dist < REACHED_THRESHOLD) {
      order.waypoints.shift();
      if (order.waypoints.length === 0) {
        pathOrders.delete(eid);
        if (order.restoreWander) {
          resumeAutonomousSteering(world, eid);
        } else {
          setStandingPace(world, eid);
        }
        continue;
      }
    }

    const nextWaypoint = order.waypoints[0];
    setPathDebugTarget(world, eid, nextWaypoint.x, nextWaypoint.y);
    const nextCenterX = nextWaypoint.x + 0.5;
    const nextCenterY = nextWaypoint.y + 0.5;
    const angle = angleToward(pos.x, pos.y, nextCenterX, nextCenterY);
    setComponent(world, eid, Direction, { angle });
    setComponent(world, eid, TargetPace, { value: TARGET_PACE_RUNNING });
  }
  return world;
}
