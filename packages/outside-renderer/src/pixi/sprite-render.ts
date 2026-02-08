import { Rectangle, Sprite, Texture, type Renderer } from 'pixi.js';
import { Size, Position, VisualSize } from '@outside/simulator';
import { hasComponent, type World } from 'bitecs';
import type { RenderKind } from '../render-classify';
import { SPRITE_SIZE } from '../constants';
import {
  getFacingDirection,
  getIsMoving,
  getWalkFrame,
} from '../animation';
import type { RenderWorldState } from '../render-world';
import type { RendererAssets } from './types';
import { getPlaceholderTexture, setNearestScale } from './assets';

/**
 * Builds a new sprite instance for a render kind.
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
      const texture = assets.icons.food ?? getPlaceholderTexture(renderer, assets, 'food');
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
  const diameter = getEntityDiameter(world, eid, kind);
  const posX = Position.x[eid];
  const posY = Position.y[eid];
  const topLeft =
    kind === 'floor' || kind === 'wall'
      ? { x: posX * tileSize, y: posY * tileSize }
      : { x: (posX - diameter / 2) * tileSize, y: (posY - diameter / 2) * tileSize };

  if (kind === 'floor' || kind === 'wall') {
    sprite.x = topLeft.x;
    sprite.y = topLeft.y;
    sprite.width = tileSize;
    sprite.height = tileSize;
    sprite.tint = kind === 'wall' ? 0x2f2f2f : 0x4b4b4b;
    return;
  }

  if (kind === 'food') {
    const texture = assets.icons.food ?? getPlaceholderTexture(renderer, assets, 'food');
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

  if ((kind === 'bot' || kind === 'hero') && assets.botIdle && assets.botWalk) {
    const facing = getFacingDirection(renderWorld, eid);
    const frame = getWalkFrame(renderWorld, eid);
    const isMoving = getIsMoving(renderWorld, eid);
    updateBotSpriteFrame(sprite, assets, facing, isMoving, frame, diameter, tileSize);
    return;
  }

  const size = kind === 'error' ? tileSize : tileSize * diameter;
  sprite.width = size;
  sprite.height = size;
}

/**
 * Reads rendering diameter from visual data, with a sane default.
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
      row = 0;
      break;
    case 'left':
      row = 2;
      flipX = true;
      break;
    case 'right':
      row = 2;
      break;
    case 'up':
      row = 4;
      break;
  }

  const padding = 2;
  const stride = SPRITE_SIZE + padding * 2;
  const frameX = frameIndex * stride + padding;
  const frameY = row * stride + padding + 2;

  sprite.texture = new Texture({
    source: source.source,
    frame: new Rectangle(frameX, frameY, SPRITE_SIZE, SPRITE_SIZE),
  });
  setNearestScale(sprite.texture);

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
