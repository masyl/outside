/**
 * Pointer and viewport API: simulation state for pointer tile and viewport follow target.
 * Renderers read and write via these APIs; state lives in ECS.
 * @packageDocumentation
 */

import { addComponent, getComponent, hasComponent, query, removeComponent } from 'bitecs';
import {
  DefaultSpriteKey,
  Observed,
  PointerKind,
  Pointer,
  PointerTile,
  Position,
  Size,
  VariantSpriteKey,
  View,
  VisualSize,
  IsViewportFocus,
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

/** Sprite key used by the render pipeline to classify pointer entities. */
export const POINTER_DEFAULT_SPRITE_KEY = 'ui.cursor.r0c0';
export const POINTER_SPRITE_KEY_PREFIX = 'ui.cursor.';

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

function setPointerVisible(world: SimulatorWorld, eid: number, visible: boolean): void {
  const hasObserved = hasComponent(world, eid, Observed);
  if (visible && !hasObserved) {
    addComponent(world, eid, Observed);
  } else if (!visible && hasObserved) {
    removeComponent(world, eid, Observed);
  }
}

function setPointerEntityWorldPosition(world: SimulatorWorld, eid: number, x: number, y: number): void {
  const hasWorldPosition = Number.isFinite(x) && Number.isFinite(y);
  const hasPosition = hasComponent(world, eid, Position);

  if (hasWorldPosition) {
    if (!hasPosition) {
      addComponent(world, eid, Position);
    }
    Position.x[eid] = x;
    Position.y[eid] = y;
    setPointerVisible(world, eid, true);
    return;
  }

  if (hasPosition) {
    removeComponent(world, eid, Position);
  }
  setPointerVisible(world, eid, false);
}

function normalizePointerSpriteKey(spriteKey: string): string {
  const trimmed = typeof spriteKey === 'string' ? spriteKey.trim() : '';
  if (!trimmed.startsWith(POINTER_SPRITE_KEY_PREFIX)) {
    return POINTER_DEFAULT_SPRITE_KEY;
  }
  return trimmed;
}

function getPointableRadius(world: SimulatorWorld, eid: number): number {
  const obstacleDiameter = hasComponent(world, eid, ObstacleSize) ? ObstacleSize.diameter[eid] : Number.NaN;
  if (Number.isFinite(obstacleDiameter) && obstacleDiameter > 0) {
    return obstacleDiameter / 2;
  }
  const sizeDiameter = hasComponent(world, eid, Size) ? Size.diameter[eid] : Number.NaN;
  if (Number.isFinite(sizeDiameter) && sizeDiameter > 0) {
    return sizeDiameter / 2;
  }
  const visualDiameter = hasComponent(world, eid, VisualSize) ? VisualSize.diameter[eid] : Number.NaN;
  if (Number.isFinite(visualDiameter) && visualDiameter > 0) {
    return visualDiameter / 2;
  }
  return 0.5;
}

function clearPointerSpriteOverride(world: SimulatorWorld, pointerEid: number): void {
  if (hasComponent(world, pointerEid, VariantSpriteKey)) {
    removeComponent(world, pointerEid, VariantSpriteKey);
  }
}

/**
 * Applies pointer-style override when hovered entity carries PointerKind.
 * Writes the override to VariantSpriteKey on the pointer entity.
 */
export function applyPointerKindOverride(world: SimulatorWorld): void {
  const pointerEid = getPointerEid(world);
  if (pointerEid == null || !hasComponent(world, pointerEid, Position)) {
    return;
  }
  const pointerX = Position.x[pointerEid];
  const pointerY = Position.y[pointerEid];
  if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) {
    clearPointerSpriteOverride(world, pointerEid);
    return;
  }

  let hoveredKindSpriteKey: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const pointables = query(world, [PointerKind, Position, Observed]);
  for (let i = 0; i < pointables.length; i++) {
    const eid = pointables[i];
    if (eid === pointerEid) continue;
    const px = Position.x[eid];
    const py = Position.y[eid];
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    const radius = getPointableRadius(world, eid);
    const distance = Math.hypot(pointerX - px, pointerY - py);
    if (distance > radius) continue;
    if (distance >= bestDistance) continue;
    bestDistance = distance;
    hoveredKindSpriteKey = normalizePointerSpriteKey(PointerKind.value[eid] ?? '');
  }

  if (!hoveredKindSpriteKey) {
    clearPointerSpriteOverride(world, pointerEid);
    return;
  }
  if (!hasComponent(world, pointerEid, VariantSpriteKey)) {
    addComponent(world, pointerEid, VariantSpriteKey);
  }
  VariantSpriteKey.value[pointerEid] = hoveredKindSpriteKey;
}

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
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  PointerTile.tileX[eid] = tileX;
  PointerTile.tileY[eid] = tileY;
  setPointerEntityWorldPosition(world, eid, tileX + 0.5, tileY + 0.5);
  applyPointerKindOverride(world);
}

/**
 * Sets the current pointer world coordinate in simulation space.
 * Also updates PointerTile so tile queries stay in sync.
 */
export function setPointerWorld(world: SimulatorWorld, x: number, y: number): void {
  const eid = getPointerEid(world);
  if (eid == null) return;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    clearPointerTile(world);
    return;
  }
  PointerTile.tileX[eid] = Math.floor(x);
  PointerTile.tileY[eid] = Math.floor(y);
  setPointerEntityWorldPosition(world, eid, x, y);
  applyPointerKindOverride(world);
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
  setPointerEntityWorldPosition(world, eid, POINTER_HIDDEN, POINTER_HIDDEN);
  clearPointerSpriteOverride(world, eid);
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
 * Returns the current pointer world coordinate from the simulation.
 * When pointer is cleared, x and y are NaN.
 */
export function getPointerWorld(world: SimulatorWorld): { x: number; y: number } {
  const eid = getPointerEid(world);
  if (eid == null) return { x: POINTER_HIDDEN, y: POINTER_HIDDEN };
  if (!hasComponent(world, eid, Position)) {
    return { x: POINTER_HIDDEN, y: POINTER_HIDDEN };
  }
  return {
    x: Position.x[eid] ?? POINTER_HIDDEN,
    y: Position.y[eid] ?? POINTER_HIDDEN,
  };
}

/**
 * Sets the pointer sprite key used by renderers.
 * Invalid values are ignored and replaced with the default pointer sprite key.
 */
export function setPointerSpriteKey(world: SimulatorWorld, spriteKey: string): void {
  const eid = getPointerEid(world);
  if (eid == null) return;
  DefaultSpriteKey.value[eid] = normalizePointerSpriteKey(spriteKey);
  applyPointerKindOverride(world);
}

/**
 * Reads the current pointer sprite key.
 */
export function getPointerSpriteKey(world: SimulatorWorld): string {
  const eid = getPointerEid(world);
  if (eid == null) return POINTER_DEFAULT_SPRITE_KEY;
  return normalizePointerSpriteKey(DefaultSpriteKey.value[eid] ?? POINTER_DEFAULT_SPRITE_KEY);
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
