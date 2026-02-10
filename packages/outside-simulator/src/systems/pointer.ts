import { addComponent, hasComponent, query, removeComponent } from 'bitecs';
import { Observed, Pointer, PointerTile, Position } from '../components';
import { applyPointerKindOverride } from '../pointer';
import type { SimulatorWorld } from '../world';

const POINTER_HIDDEN = Number.NaN;

/**
 * Keeps pointer render state consistent from ECS components.
 * Position is the source of truth for renderer-facing pointer coordinates.
 */
export function pointerSystem(world: SimulatorWorld): SimulatorWorld {
  const pointerEids = query(world, [Pointer, PointerTile]);

  for (let i = 0; i < pointerEids.length; i++) {
    const eid = pointerEids[i];
    const hasPosition = hasComponent(world, eid, Position);
    const worldX = hasPosition ? Position.x[eid] : POINTER_HIDDEN;
    const worldY = hasPosition ? Position.y[eid] : POINTER_HIDDEN;
    const hasWorldPosition = Number.isFinite(worldX) && Number.isFinite(worldY);

    if (hasWorldPosition) {
      PointerTile.tileX[eid] = Math.floor(worldX);
      PointerTile.tileY[eid] = Math.floor(worldY);
      if (!hasComponent(world, eid, Observed)) {
        addComponent(world, eid, Observed);
      }
      continue;
    }

    const tileX = PointerTile.tileX[eid];
    const tileY = PointerTile.tileY[eid];
    const hasTile = Number.isFinite(tileX) && Number.isFinite(tileY);
    if (hasTile) {
      if (!hasPosition) {
        addComponent(world, eid, Position);
      }
      Position.x[eid] = tileX + 0.5;
      Position.y[eid] = tileY + 0.5;
      if (!hasComponent(world, eid, Observed)) {
        addComponent(world, eid, Observed);
      }
      continue;
    }

    PointerTile.tileX[eid] = POINTER_HIDDEN;
    PointerTile.tileY[eid] = POINTER_HIDDEN;
    if (hasPosition) {
      removeComponent(world, eid, Position);
    }
    if (hasComponent(world, eid, Observed)) {
      removeComponent(world, eid, Observed);
    }
  }
  applyPointerKindOverride(world);

  return world;
}
