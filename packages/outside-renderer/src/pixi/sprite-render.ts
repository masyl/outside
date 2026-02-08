import { Rectangle, Sprite, Texture, type Renderer } from 'pixi.js';
import { Size, Position, VisualSize } from '@outside/simulator';
import { hasComponent, type World } from 'bitecs';
import { resolveSpriteKey, type RenderKind } from '../render-classify';
import { SPRITE_SIZE } from '../constants';
import {
  getFacingDirection,
  getIsMoving,
  getWalkFrame,
} from '../animation';
import type { RenderWorldState } from '../render-world';
import type { RendererAssets } from './types';
import { getPlaceholderTexture, setNearestScale } from './assets';
import { resolveFoodTexture } from './food-textures';

/**
 * Builds a new sprite instance for a render kind.
 *
 * @param renderer `Renderer` used for placeholder texture generation.
 * @param assets `RendererAssets` loaded textures and placeholder cache.
 * @param kind `RenderKind` render classification for sprite/layer setup.
 * @returns `Sprite` newly created display object for this entity kind.
 */
export function createSpriteForKind(
  renderer: Renderer,
  assets: RendererAssets,
  kind: RenderKind
): Sprite {
  switch (kind) {
    case 'floor':
    case 'wall': {
      const sprite = new Sprite(Texture.WHITE);
      sprite.roundPixels = true;
      sprite.zIndex = kind === 'wall' ? 1 : 0;
      return sprite;
    }
    case 'food': {
      const texture =
        resolveFoodTexture(assets.foodTextureBySpriteKey, null) ??
        getPlaceholderTexture(renderer, assets, 'error');
      const sprite = new Sprite(texture);
      sprite.roundPixels = true;
      sprite.zIndex = 3;
      return sprite;
    }
    case 'hero': {
      const texture =
        assets.botIdle ??
        assets.icons.bot ??
        getPlaceholderTexture(renderer, assets, 'bot');
      const sprite = new Sprite(texture);
      sprite.roundPixels = true;
      sprite.zIndex = 4;
      return sprite;
    }
    case 'bot':
    case 'error':
    default: {
      const texture =
        kind === 'error'
          ? getPlaceholderTexture(renderer, assets, 'error')
          : assets.botIdle ??
            assets.icons.bot ??
            getPlaceholderTexture(renderer, assets, 'bot');
      const sprite = new Sprite(texture);
      sprite.roundPixels = true;
      sprite.zIndex = kind === 'error' ? 5 : 3;
      return sprite;
    }
  }
}

/**
 * Updates an existing sprite's texture, transform, and sizing for the current world entity state.
 *
 * @param renderer `Renderer` used for placeholder texture generation.
 * @param sprite `Sprite` display object to mutate in-place.
 * @param kind `RenderKind` render classification for the entity.
 * @param eid `number` entity id in the render ECS world.
 * @param tileSize `number` world tile side length in pixels.
 * @param renderWorld `RenderWorldState` current deserialized render snapshot.
 * @param assets `RendererAssets` loaded textures and placeholder cache.
 */
export function updateSpriteForEntity(
  renderer: Renderer,
  sprite: Sprite,
  kind: RenderKind,
  eid: number,
  tileSize: number,
  renderWorld: RenderWorldState,
  assets: RendererAssets
): void {
  const world = renderWorld.world;
  const spriteKey = resolveSpriteKey(world, eid);
  const diameter = getEntityDiameter(world, eid, kind);
  const posX = Position.x[eid];
  const posY = Position.y[eid];
  if (!Number.isFinite(posX) || !Number.isFinite(posY)) {
    sprite.visible = false;
    return;
  }
  sprite.visible = true;
  // World positions are center-based for entities and corner-based for tiles.
  // Convert center positions to top-left so sprite bounds align with tile grid.
  // Convert world coordinates (Y-up) to local render coordinates.
  // Tiles are anchored at their bottom-left corner in world space.
  const topLeft =
    kind === 'floor' || kind === 'wall'
      ? { x: posX * tileSize, y: -(posY + 1) * tileSize }
      : { x: (posX - diameter / 2) * tileSize, y: -(posY + diameter / 2) * tileSize };

  if (kind === 'floor' || kind === 'wall') {
    sprite.x = topLeft.x;
    sprite.y = topLeft.y;
    sprite.width = tileSize;
    sprite.height = tileSize;
    sprite.tint = kind === 'wall' ? 0x2f2f2f : 0x4b4b4b;
    return;
  }

  if (kind === 'food') {
    const texture =
      resolveFoodTexture(assets.foodTextureBySpriteKey, spriteKey) ??
      getPlaceholderTexture(renderer, assets, 'error');
    if (sprite.texture !== texture) {
      sprite.texture = texture;
      setNearestScale(sprite.texture);
    }
  }
  if (kind === 'bot') {
    const texture =
      assets.botIdle ??
      assets.icons.bot ??
      getPlaceholderTexture(renderer, assets, 'bot');
    if (sprite.texture !== texture) {
      sprite.texture = texture;
      setNearestScale(sprite.texture);
    }
  }

  sprite.x = topLeft.x;
  sprite.y = topLeft.y;

  if (kind === 'bot' || kind === 'hero') {
    const actorVariantSheet = spriteKey
      ? assets.actorVariantSheetBySpriteKey.get(spriteKey)
      : undefined;
    const facing = getFacingDirection(renderWorld, eid);
    const frame = getWalkFrame(renderWorld, eid);
    const isMoving = getIsMoving(renderWorld, eid);
    if (actorVariantSheet) {
      updateActorVariantSpriteFrame(
        sprite,
        actorVariantSheet.texture,
        actorVariantSheet.animation,
        facing,
        isMoving,
        frame,
        diameter,
        tileSize
      );
      return;
    }
    if (assets.botIdle && assets.botWalk) {
      updateBotSpriteFrame(
        sprite,
        assets,
        facing,
        isMoving,
        frame,
        diameter,
        tileSize
      );
      return;
    }
  }

  const size = kind === 'error' ? tileSize : tileSize * diameter;
  sprite.width = size;
  sprite.height = size;
}

/**
 * Reads rendering diameter from visual data, with a sane default.
 *
 * @param world `World` render ECS world.
 * @param eid `number` entity id.
 * @param kind `RenderKind` classification used to shortcut tile sizing.
 * @returns `number` display diameter in tile units.
 */
export function getEntityDiameter(world: World, eid: number, kind: RenderKind): number {
  if (kind === 'floor' || kind === 'wall') return 1;
  if (hasComponent(world, eid, VisualSize)) {
    return VisualSize.diameter[eid] ?? 1;
  }
  if (hasComponent(world, eid, Size)) {
    return Size.diameter[eid] ?? 1;
  }
  return 1;
}

function updateBotSpriteFrame(
  sprite: Sprite,
  assets: RendererAssets,
  direction: 'up' | 'down' | 'left' | 'right',
  isMoving: boolean,
  frameIndex: number,
  diameter: number,
  tileSize: number
): void {
  if (!assets.botIdle || !assets.botWalk) return;
  const source = isMoving ? assets.botWalk : assets.botIdle;

  let row = 0;
  let flipX = false;

  switch (direction) {
    case 'down':
      row = 4;
      break;
    case 'left':
      row = 2;
      flipX = true;
      break;
    case 'right':
      row = 2;
      break;
    case 'up':
      row = 0;
      break;
  }

  const padding = 2;
  // Frames are laid out on a fixed grid: frame width plus symmetric transparent padding.
  const stride = SPRITE_SIZE + padding * 2;
  const frameX = frameIndex * stride + padding;
  const frameY = row * stride + padding + 2;

  sprite.texture = new Texture({
    source: source.source,
    frame: new Rectangle(frameX, frameY, SPRITE_SIZE, SPRITE_SIZE),
  });
  setNearestScale(sprite.texture);

  // Scale from native 16x16 frame pixels to world tile pixels, including large-entity diameter.
  const baseScale = (tileSize / SPRITE_SIZE) * diameter;
  sprite.anchor.set(0, 0);
  if (flipX) {
    sprite.scale.x = -baseScale;
    sprite.pivot.x = SPRITE_SIZE;
  } else {
    sprite.scale.x = baseScale;
    sprite.pivot.x = 0;
  }
  sprite.scale.y = baseScale;
  sprite.pivot.y = 0;
}

function updateActorVariantSpriteFrame(
  sprite: Sprite,
  sheet: Texture,
  animation: {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    idleRow: number;
    walkRow: number;
    framePitchX: number;
    framePitchY: number;
    frameInsetX: number;
    frameInsetY: number;
    cardinalDirectionToGroup: {
      down: number;
      right: number;
      up: number;
      left: number;
    };
  },
  direction: 'up' | 'down' | 'left' | 'right',
  isMoving: boolean,
  frameIndex: number,
  diameter: number,
  tileSize: number
): void {
  const row = isMoving ? animation.walkRow : animation.idleRow;
  const group = animation.cardinalDirectionToGroup[direction];
  const frameStep = ((frameIndex % animation.frameCount) + animation.frameCount) % animation.frameCount;
  const frameX =
    group * animation.frameCount * animation.framePitchX +
    frameStep * animation.framePitchX +
    animation.frameInsetX;
  const frameY = row * animation.framePitchY + animation.frameInsetY;

  sprite.texture = new Texture({
    source: sheet.source,
    frame: new Rectangle(
      frameX,
      frameY,
      animation.frameWidth,
      animation.frameHeight
    ),
  });
  setNearestScale(sprite.texture);

  const baseScale = (tileSize / animation.frameWidth) * diameter;
  sprite.anchor.set(0, 0);
  sprite.pivot.x = 0;
  sprite.pivot.y = 0;
  sprite.scale.x = baseScale;
  sprite.scale.y = baseScale;
}
