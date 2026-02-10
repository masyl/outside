/**
 * Pathfinding debug helpers produced from simulator state.
 * These functions belong to simulation/debug tooling, not renderer-side logic.
 *
 * @packageDocumentation
 */

import { query } from 'bitecs';
import { Position, WanderPersistence } from './components';
import { getEntityPath } from './path-following';
import { findPath } from './pathfinding';
import type { SimulatorWorld } from './world';

export type PathfindingDebugPath = {
  eid: number;
  points: Array<{ x: number; y: number }>;
  checkpoints?: Array<{ x: number; y: number }>;
  style?: 'ordered' | 'wander';
};

/**
 * Builds debug path points for the currently ordered path of one entity.
 */
export function getOrderedPathDebug(
  world: SimulatorWorld,
  eid: number
): PathfindingDebugPath | null {
  if (!Number.isFinite(eid) || eid <= 0) return null;
  const px = Position.x[eid];
  const py = Position.y[eid];
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  const orderedPath = getEntityPath(world, eid);
  if (orderedPath.length === 0) return null;
  return {
    eid,
    points: [{ x: px, y: py }, ...orderedPath.map((w) => ({ x: w.x + 0.5, y: w.y + 0.5 }))],
    checkpoints: orderedPath.map((w) => ({ x: w.x + 0.5, y: w.y + 0.5 })),
    style: 'ordered',
  };
}

/**
 * Builds debug path points for all wander entities that currently have a reachable target.
 */
export function getWanderPathDebug(world: SimulatorWorld): PathfindingDebugPath[] {
  const paths: PathfindingDebugPath[] = [];
  const wanderers = query(world, [Position, WanderPersistence]);
  for (let i = 0; i < wanderers.length; i++) {
    const eid = wanderers[i];
    const fromX = Position.x[eid];
    const fromY = Position.y[eid];
    const targetTileX = WanderPersistence.targetTileX[eid];
    const targetTileY = WanderPersistence.targetTileY[eid];
    if (
      !Number.isFinite(fromX) ||
      !Number.isFinite(fromY) ||
      !Number.isFinite(targetTileX) ||
      !Number.isFinite(targetTileY)
    ) {
      continue;
    }
    const path = findPath(
      world,
      { x: fromX, y: fromY },
      { x: targetTileX + 0.5, y: targetTileY + 0.5 }
    );
    if (path.length < 2) continue;
    paths.push({
      eid,
      points: path.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 })),
      style: 'wander',
    });
  }
  return paths;
}

/**
 * Builds full pathfinding debug paths:
 * - optional ordered path for a focused entity
 * - wander paths for all other wanderers
 */
export function getPathfindingDebugPaths(
  world: SimulatorWorld,
  options?: { focusedEid?: number | null }
): PathfindingDebugPath[] {
  const focusedEid = options?.focusedEid ?? null;
  const ordered = focusedEid != null ? getOrderedPathDebug(world, focusedEid) : null;
  const wander = getWanderPathDebug(world).filter((path) => path.eid !== focusedEid);
  if (ordered == null) return wander;
  return [ordered, ...wander];
}
