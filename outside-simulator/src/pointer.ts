/**
 * Pointer and viewport API: simulation state for pointer tile and viewport follow target.
 * Renderers read and write via these APIs; state lives in ECS.
 * @packageDocumentation
 */

import { query, getComponent } from 'bitecs';
import {
  Pointer,
  PointerTile,
  View,
  IsViewportFocus,
  Position,
  ObstacleSize,
  PointerTarget,
  FloorTile,
  Obstacle,
} from './components';
import type { SimulatorWorld } from './world';

export type ResolveEntityKind = 'empty' | 'floor' | 'wall' | 'bot';

export interface ResolveEntityResult {
  kind: ResolveEntityKind;
  eid?: number;
}

function getPointerEid(world: SimulatorWorld): number | null {
  const ents = query(world, [Pointer, PointerTile]);
  return ents.length > 0 ? ents[0] : null;
}

function getViewEid(world: SimulatorWorld): number | null {
  const ents = query(world, [View, IsViewportFocus]);
  return ents.length > 0 ? ents[0] : null;
}

/** Sentinel: pointer is hidden (e.g. mouse left viewport). */
const POINTER_HIDDEN = Number.NaN;

/**
 * Sets the current pointer tile in the simulation (floor grid resolution).
 */
export function setPointerTile(
  world: SimulatorWorld,
  x: number,
  y: number
): void {
  const eid = getPointerEid(world);
  if (eid == null) return;
  PointerTile.tileX[eid] = Math.floor(x);
  PointerTile.tileY[eid] = Math.floor(y);
}

/**
 * Clears the pointer location so it is hidden (e.g. when mouse leaves the viewport).
 * getPointerTile will return { x: NaN, y: NaN }; renderers should not draw the pointer when either value is not finite.
 */
export function clearPointerTile(world: SimulatorWorld): void {
  const eid = getPointerEid(world);
  if (eid == null) return;
  PointerTile.tileX[eid] = POINTER_HIDDEN;
  PointerTile.tileY[eid] = POINTER_HIDDEN;
}

/**
 * Returns the current pointer tile from the simulation.
 * When the pointer is cleared (e.g. mouse left viewport), x and y are NaN; use Number.isFinite to detect.
 */
export function getPointerTile(
  world: SimulatorWorld
): { x: number; y: number } {
  const eid = getPointerEid(world);
  if (eid == null) return { x: POINTER_HIDDEN, y: POINTER_HIDDEN };
  return {
    x: PointerTile.tileX[eid] ?? POINTER_HIDDEN,
    y: PointerTile.tileY[eid] ?? POINTER_HIDDEN,
  };
}

/**
 * Resolves what is at tile (x, y): empty, floor, wall, or bot. Bots take precedence over floor/wall.
 */
export function resolveEntityAt(
  world: SimulatorWorld,
  x: number,
  y: number
): ResolveEntityResult {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const centerX = tx + 0.5;
  const centerY = ty + 0.5;

  const bots = query(world, [Position, ObstacleSize, PointerTarget]);
  for (const eid of bots) {
    const pos = getComponent(world, eid, Position);
    const size = getComponent(world, eid, ObstacleSize);
    const r = size.diameter / 2;
    const dist = Math.hypot(pos.x - centerX, pos.y - centerY);
    if (dist < r) return { kind: 'bot', eid };
  }

  const wallEids = new Set(query(world, [FloorTile, Obstacle]));
  const floorTiles = query(world, [Position, FloorTile, PointerTarget]);
  for (const eid of floorTiles) {
    const pos = getComponent(world, eid, Position);
    if (pos.x === tx && pos.y === ty) {
      if (wallEids.has(eid)) return { kind: 'wall', eid };
      return { kind: 'floor', eid };
    }
  }

  return { kind: 'empty' };
}

/**
 * Returns the entity id the viewport is following (0 if none).
 */
export function getViewportFollowTarget(world: SimulatorWorld): number {
  const viewEid = getViewEid(world);
  if (viewEid == null) return 0;
  return IsViewportFocus.eid[viewEid] ?? 0;
}

/**
 * Sets the entity the viewport should follow (0 to clear).
 */
export function setViewportFollowTarget(
  world: SimulatorWorld,
  eid: number
): void {
  const viewEid = getViewEid(world);
  if (viewEid == null) return;
  IsViewportFocus.eid[viewEid] = eid;
}
