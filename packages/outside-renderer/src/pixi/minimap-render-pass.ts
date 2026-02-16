import { Graphics, type Container } from 'pixi.js';
import { MinimapPixel, Observed, Position, PositionZ } from '@outside/simulator';
import { hasComponent, query } from 'bitecs';
import { classifyRenderKind, type RenderKind } from '../render-classify';
import type { RenderWorldState } from '../render-world';

const DEPTH_Y_SCALE = 1_000_000;
const DEPTH_Z_SCALE = 1_000;

function setNodeLabel(node: { label?: string }, label: string): void {
  node.label = label;
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function minimapColorHex(eid: number): number {
  const r = clampByte(MinimapPixel.r[eid] ?? 0);
  const g = clampByte(MinimapPixel.g[eid] ?? 0);
  const b = clampByte(MinimapPixel.b[eid] ?? 0);
  return (r << 16) | (g << 8) | b;
}

function snappedTileCoordinate(value: number, kind: RenderKind): number {
  if (!Number.isFinite(value)) return 0;
  return kind === 'floor' || kind === 'wall' ? Math.round(value) : Math.floor(value);
}

function rawTileCoordinate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function computeDepthZIndex(renderWorld: RenderWorldState, eid: number, kind: RenderKind): number {
  if (kind === 'pointer') {
    return Number.MAX_SAFE_INTEGER - eid;
  }
  const world = renderWorld.world;
  const y = Position.y[eid];
  if (!Number.isFinite(y)) return 0;

  const footY = kind === 'floor' || kind === 'wall' ? y : y - 0.5;
  const yDepthBucket = Math.round(-footY * 1000);

  const z = Number.isFinite(PositionZ.z[eid]) ? PositionZ.z[eid] : 0;
  const zDepthBucket = Math.round(z * 100);

  return yDepthBucket * DEPTH_Y_SCALE + zDepthBucket * DEPTH_Z_SCALE + eid;
}

export interface MinimapDisplayState {
  displayIndex: Map<number, Graphics>;
  displayKinds: Map<number, RenderKind>;
}

/**
 * Draws a simplified minimap pass with snapped tile-sized pixels.
 */
export function runMinimapRenderPass(
  renderWorld: RenderWorldState,
  tileSize: number,
  layer: Container,
  state: MinimapDisplayState,
  rendererLabel: string,
  snapToGrid: boolean
): void {
  const world = renderWorld.world;
  const entities = query(world, [Observed, Position]);
  const nextIds = new Set<number>();

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const kind = classifyRenderKind(world, eid);
    if (kind === 'error') continue;
    const hasMinimapColor = hasComponent(world, eid, MinimapPixel);
    if (!hasMinimapColor && kind !== 'pointer') continue;
    nextIds.add(eid);

    let pixel = state.displayIndex.get(eid);
    const previousKind = state.displayKinds.get(eid);

    if (pixel && previousKind && previousKind !== kind) {
      pixel.removeFromParent();
      pixel.destroy();
      state.displayIndex.delete(eid);
      state.displayKinds.delete(eid);
      pixel = undefined;
    }

    if (!pixel) {
      pixel = new Graphics();
      setNodeLabel(pixel, `${rendererLabel}:minimap:${kind}:eid:${eid}`);
      pixel.zIndex = 0;
      state.displayIndex.set(eid, pixel);
      state.displayKinds.set(eid, kind);
      layer.addChild(pixel);
    }

    const tileX = snapToGrid
      ? snappedTileCoordinate(Position.x[eid], kind)
      : rawTileCoordinate(Position.x[eid]);
    const tileY = snapToGrid
      ? snappedTileCoordinate(Position.y[eid], kind)
      : rawTileCoordinate(Position.y[eid]);
    const color = kind === 'pointer' ? 0xffffff : minimapColorHex(eid);
    pixel.clear();
    pixel.rect(0, 0, tileSize, tileSize);
    pixel.fill(color);
    pixel.alpha = 1;
    pixel.x = tileX * tileSize;
    pixel.y = -(tileY + 1) * tileSize;
    pixel.zIndex = computeDepthZIndex(renderWorld, eid, kind);
  }

  for (const [eid, pixel] of state.displayIndex.entries()) {
    if (nextIds.has(eid)) continue;
    pixel.removeFromParent();
    pixel.destroy();
    state.displayIndex.delete(eid);
    state.displayKinds.delete(eid);
  }
}
