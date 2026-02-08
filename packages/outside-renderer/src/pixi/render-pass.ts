import type { Container, Renderer, Sprite } from 'pixi.js';
import { Position } from '@outside/simulator';
import { query } from 'bitecs';
import { classifyRenderKind, type RenderKind } from '../render-classify';
import type { RenderWorldState } from '../render-world';
import type { RendererAssets } from './types';
import { createSpriteForKind, updateSpriteForEntity } from './sprite-render';

/**
 * Per-frame renderer counters used for diagnostics.
 */
export interface RenderPassStats {
  floorCount: number;
  wallCount: number;
  heroCount: number;
  foodCount: number;
  botCount: number;
  errorCount: number;
  entityCount: number;
  displayCount: number;
  tileDisplayCount: number;
  entityDisplayCount: number;
}

/**
 * Mutable display index shared across render frames.
 */
export interface RenderDisplayState {
  displayIndex: Map<number, Sprite>;
  displayKinds: Map<number, RenderKind>;
}

/**
 * Executes one entity render pass over current render-world state.
 *
 * @param renderer `Renderer` used for sprite creation and texture generation.
 * @param renderWorld `RenderWorldState` source ECS world.
 * @param assets `RendererAssets` loaded textures and placeholders.
 * @param tileSize `number` current tile side length in pixels.
 * @param tileLayer `Container` destination layer for floor/wall sprites.
 * @param entityLayer `Container` destination layer for actors/items sprites.
 * @param state `RenderDisplayState` persistent display object maps.
 * @returns `RenderPassStats` aggregate counters for logs/debug labels.
 */
export function runRenderPass(
  renderer: Renderer,
  renderWorld: RenderWorldState,
  assets: RendererAssets,
  tileSize: number,
  tileLayer: Container,
  entityLayer: Container,
  state: RenderDisplayState
): RenderPassStats {
  const world = renderWorld.world;
  const entities = query(world, [Position]);
  const nextIds = new Set<number>();

  const stats: RenderPassStats = {
    floorCount: 0,
    wallCount: 0,
    heroCount: 0,
    foodCount: 0,
    botCount: 0,
    errorCount: 0,
    entityCount: entities.length,
    displayCount: 0,
    tileDisplayCount: 0,
    entityDisplayCount: 0,
  };

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const kind = classifyRenderKind(world, eid);
    if (!kind) continue;
    nextIds.add(eid);
    countKind(stats, kind);

    let sprite = state.displayIndex.get(eid);
    const previousKind = state.displayKinds.get(eid);

    // Recreate sprite only if classification changed because it may require a layer swap.
    if (sprite && previousKind && previousKind !== kind) {
      sprite.destroy();
      state.displayIndex.delete(eid);
      state.displayKinds.delete(eid);
      sprite = undefined;
    }

    if (!sprite) {
      sprite = createSpriteForKind(renderer, assets, kind);
      state.displayIndex.set(eid, sprite);
      state.displayKinds.set(eid, kind);
      if (kind === 'floor' || kind === 'wall') {
        tileLayer.addChild(sprite);
      } else {
        entityLayer.addChild(sprite);
      }
    }

    updateSpriteForEntity(renderer, sprite, kind, eid, tileSize, renderWorld, assets);
  }

  for (const [eid, sprite] of state.displayIndex.entries()) {
    if (nextIds.has(eid)) continue;
    sprite.destroy();
    state.displayIndex.delete(eid);
    state.displayKinds.delete(eid);
  }

  stats.displayCount = state.displayIndex.size;
  stats.tileDisplayCount = tileLayer.children.length;
  stats.entityDisplayCount = entityLayer.children.length;
  return stats;
}

function countKind(stats: RenderPassStats, kind: RenderKind): void {
  switch (kind) {
    case 'floor':
      stats.floorCount += 1;
      break;
    case 'wall':
      stats.wallCount += 1;
      break;
    case 'hero':
      stats.heroCount += 1;
      break;
    case 'food':
      stats.foodCount += 1;
      break;
    case 'bot':
      stats.botCount += 1;
      break;
    case 'error':
      stats.errorCount += 1;
      break;
    default:
      stats.botCount += 1;
      break;
  }
}
