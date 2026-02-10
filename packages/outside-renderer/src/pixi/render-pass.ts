import { Graphics, type Container, type Renderer, type Sprite } from 'pixi.js';
import {
  DefaultSpriteKey,
  Food,
  FloorTile,
  Hero,
  Observed,
  Obstacle,
  Position,
  VariantSpriteKey,
  Walkable,
} from '@outside/simulator';
import { hasComponent, query } from 'bitecs';
import {
  classifyRenderKind,
  resolveSpriteKey,
  type RenderKind,
} from '../render-classify';
import type { RenderWorldState } from '../render-world';
import type { RendererAssets } from './types';
import {
  createSpriteForKind,
  getEntityDiameter,
  updateSpriteForEntity,
} from './sprite-render';

function setNodeLabel(node: { label?: string }, label: string): void {
  node.label = label;
}

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
  shadowIndex: Map<number, Graphics>;
}

export interface RenderSpatialIndex {
  floorCells: Set<string>;
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
 * @param rendererLabel `string` identifier used to tag nodes for DevTools inspection.
 * @returns `RenderPassStats` aggregate counters for logs/debug labels.
 */
export function runRenderPass(
  renderer: Renderer,
  renderWorld: RenderWorldState,
  assets: RendererAssets,
  tileSize: number,
  tileLayer: Container,
  entityLayer: Container,
  state: RenderDisplayState,
  rendererLabel: string
): RenderPassStats {
  const world = renderWorld.world;
  // Only render entities that explicitly opt into the sprite-key rendering contract.
  const entities = query(world, [Observed, Position, DefaultSpriteKey]);
  const nextIds = new Set<number>();
  const floorCells = new Set<string>();
  const unresolvedEntities: Array<{
    eid: number;
    position: { x: number; y: number };
    resolvedSpriteKey: string | null;
    defaultSpriteKey: string | null;
    variantSpriteKey: string | null;
    components: {
      floorTile: boolean;
      obstacle: boolean;
      walkable: boolean;
      food: boolean;
      hero: boolean;
    };
  }> = [];

  const stats: RenderPassStats = {
    floorCount: 0,
    wallCount: 0,
    heroCount: 0,
    foodCount: 0,
    botCount: 0,
    errorCount: 0,
    entityCount: 0,
    displayCount: 0,
    tileDisplayCount: 0,
    entityDisplayCount: 0,
  };

  const floorTiles = query(world, [Observed, FloorTile, Position]);
  for (let i = 0; i < floorTiles.length; i++) {
    const eid = floorTiles[i];
    if (hasComponent(world, eid, Obstacle)) continue;
    const x = Position.x[eid];
    const y = Position.y[eid];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    floorCells.add(`${Math.round(x)},${Math.round(y)}`);
  }
  const spatialIndex: RenderSpatialIndex = { floorCells };

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const kind = classifyRenderKind(world, eid);
    if (!kind) continue;
    if (kind === 'error') {
      // Unknown sprite keys are considered data issues and are intentionally not rendered.
      // Rendering them as fallback sprites can explode display-object counts when stream data is noisy.
      stats.errorCount += 1;
      const defaultSprite = DefaultSpriteKey.value[eid];
      const variantSprite = VariantSpriteKey.value[eid];
      unresolvedEntities.push({
        eid,
        position: {
          x: Position.x[eid],
          y: Position.y[eid],
        },
        resolvedSpriteKey: resolveSpriteKey(world, eid),
        defaultSpriteKey:
          typeof defaultSprite === 'string' ? defaultSprite : null,
        variantSpriteKey:
          typeof variantSprite === 'string' ? variantSprite : null,
        components: {
          floorTile: hasComponent(world, eid, FloorTile),
          obstacle: hasComponent(world, eid, Obstacle),
          walkable: hasComponent(world, eid, Walkable),
          food: hasComponent(world, eid, Food),
          hero: hasComponent(world, eid, Hero),
        },
      });
      continue;
    }

    stats.entityCount += 1;
    nextIds.add(eid);
    countKind(stats, kind);

    let sprite = state.displayIndex.get(eid);
    let shadow = state.shadowIndex.get(eid);
    const previousKind = state.displayKinds.get(eid);

    // Recreate sprite only if classification changed because it may require a layer swap.
    if (sprite && previousKind && previousKind !== kind) {
      sprite.removeFromParent();
      sprite.destroy();
      state.displayIndex.delete(eid);
      state.displayKinds.delete(eid);
      sprite = undefined;
    }
    if (shadow && previousKind && previousKind !== kind) {
      shadow.removeFromParent();
      shadow.destroy();
      state.shadowIndex.delete(eid);
      shadow = undefined;
    }

    if (!sprite) {
      sprite = createSpriteForKind(renderer, assets, kind);
      setNodeLabel(sprite, `${rendererLabel}:${kind}:eid:${eid}`);
      state.displayIndex.set(eid, sprite);
      state.displayKinds.set(eid, kind);
      if (kind === 'floor' || kind === 'wall') {
        tileLayer.addChild(sprite);
      } else {
        entityLayer.addChild(sprite);
      }
    }
    if (shouldRenderShadow(kind) && !shadow) {
      shadow = createShadow();
      setNodeLabel(shadow, `${rendererLabel}:shadow:eid:${eid}`);
      state.shadowIndex.set(eid, shadow);
      entityLayer.addChild(shadow);
    }
    if (!shouldRenderShadow(kind) && shadow) {
      shadow.removeFromParent();
      shadow.destroy();
      state.shadowIndex.delete(eid);
      shadow = undefined;
    }

    updateSpriteForEntity(renderer, sprite, kind, eid, tileSize, renderWorld, assets, spatialIndex);
    if (shadow) {
      updateShadowForEntity(shadow, kind, eid, tileSize, renderWorld);
    }
  }

  for (const [eid, sprite] of state.displayIndex.entries()) {
    if (nextIds.has(eid)) continue;
    sprite.removeFromParent();
    sprite.destroy();
    state.displayIndex.delete(eid);
    state.displayKinds.delete(eid);
  }
  for (const [eid, shadow] of state.shadowIndex.entries()) {
    if (nextIds.has(eid)) continue;
    shadow.removeFromParent();
    shadow.destroy();
    state.shadowIndex.delete(eid);
  }

  stats.displayCount = state.displayIndex.size;
  stats.tileDisplayCount = tileLayer.children.length;
  stats.entityDisplayCount = entityLayer.children.length;
  if (unresolvedEntities.length > 0) {
    console.log('[PixiEcsRenderer] unresolved render entities', {
      total: unresolvedEntities.length,
      entities: unresolvedEntities.slice(0, 50),
    });
  }
  return stats;
}

function shouldRenderShadow(kind: RenderKind): boolean {
  return kind === 'bot' || kind === 'hero' || kind === 'food';
}

function createShadow(): Graphics {
  const shadow = new Graphics();
  shadow.zIndex = 2;
  shadow.alpha = 1;
  return shadow;
}

function updateShadowForEntity(
  shadow: Graphics,
  kind: RenderKind,
  eid: number,
  tileSize: number,
  renderWorld: RenderWorldState
): void {
  const world = renderWorld.world;
  const posX = Position.x[eid];
  const posY = Position.y[eid];
  const diameter = getEntityDiameter(world, eid, kind);
  if (!Number.isFinite(posX) || !Number.isFinite(posY) || !Number.isFinite(diameter)) {
    shadow.visible = false;
    return;
  }
  shadow.visible = true;

  const radius = (diameter * tileSize) / 2;
  const cx = posX * tileSize;
  const cy = -posY * tileSize + radius * 0.95;
  const rx = Math.max(2, radius * 0.58);
  const ry = Math.max(1.25, radius * 0.24);

  shadow.clear();
  shadow.ellipse(cx, cy, rx, ry);
  shadow.fill({ color: 0x000000, alpha: 0.36 });
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
