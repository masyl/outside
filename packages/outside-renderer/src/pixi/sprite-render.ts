import { Rectangle, Sprite, Texture, type Renderer } from 'pixi.js';
import {
  Direction,
  Grounded,
  ObstacleSize,
  Position,
  PositionZ,
  PreviousPosition,
  Size,
  VelocityZ,
  VisualSize,
} from '@outside/simulator';
import { SOCCER_BALL_SHEET_LAYOUT } from '@outside/resource-packs/soccer-ball/meta';
import { hasComponent, type World } from 'bitecs';
import { resolveSpriteKey, type RenderKind } from '../render-classify';
import { SPRITE_SIZE } from '../constants';
import { getFacingDirection, getIsMoving, getWalkFrame } from '../animation';
import type { RenderWorldState } from '../render-world';
import type { RendererAssets } from './types';
import { getPlaceholderTexture, setNearestScale } from './assets';
import { resolveFoodTexture } from './food-textures';
import { pickTileSubVariantIndex, pickTileVariant } from './tile-variants';
import type { RenderSpatialIndex } from './render-pass';

const AIRBORNE_LIFT_EXAGGERATION = 2;
const BOT_SHEET_FRAME_PADDING_PX = 2;
const ACTOR_FRAME_SAFE_PADDING_PX = 4;
const SOCCER_BALL_ROLL_FRAMES_PER_TILE = SOCCER_BALL_SHEET_LAYOUT.columns;
const SOCCER_BALL_VERTICAL_OFFSET_VIRTUAL_PX = 2;

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
    case 'ball': {
      const texture =
        assets.soccerBallSheet ??
        resolveFoodTexture(assets.foodTextureBySpriteKey, null) ??
        getPlaceholderTexture(renderer, assets, 'error');
      const sprite = new Sprite(texture);
      sprite.roundPixels = true;
      sprite.zIndex = 3;
      return sprite;
    }
    case 'pointer': {
      const texture =
        assets.pointerCursorBySpriteKey.get('ui.cursor.r0c0') ??
        assets.pointerCursor ??
        getPlaceholderTexture(renderer, assets, 'hero');
      const sprite = new Sprite(texture);
      sprite.roundPixels = true;
      sprite.zIndex = 10;
      return sprite;
    }
    case 'hero': {
      const texture =
        assets.botIdle ?? assets.icons.bot ?? getPlaceholderTexture(renderer, assets, 'bot');
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
          : (assets.botIdle ?? assets.icons.bot ?? getPlaceholderTexture(renderer, assets, 'bot'));
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
  assets: RendererAssets,
  spatialIndex?: RenderSpatialIndex
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
    const tileBucket =
      kind === 'wall' ? assets.tileTextureByKind.wall : assets.tileTextureByKind.floor;
    const variants =
      kind === 'wall'
        ? tileBucket.variants.filter((variant) =>
            shouldAllowWallVariant(variant.spriteKey, posX, posY, eid, spatialIndex)
          )
        : tileBucket.variants;

    let tileVariant = pickTileVariant(
      {
        base: tileBucket.base ?? null,
        variants,
      },
      { kind, worldX: posX, worldY: posY, eid }
    );

    // Keep mouse-hole walls intentionally rare in addition to normal 75/25 variant weighting.
    // This yields a much sparser decorative placement.
    if (
      kind === 'wall' &&
      tileVariant?.spriteKey === 'tile.wall.mouse-hole' &&
      !shouldPickRareMouseHole(posX, posY, eid)
    ) {
      const withoutMouseHole = variants.filter(
        (variant) => variant.spriteKey !== 'tile.wall.mouse-hole'
      );
      tileVariant = pickTileVariant(
        {
          base: tileBucket.base ?? null,
          variants: withoutMouseHole,
        },
        { kind, worldX: posX, worldY: posY, eid }
      );
    }
    if (tileVariant && sprite.texture !== tileVariant.texture) {
      sprite.texture = tileVariant.texture;
      setNearestScale(sprite.texture);
    }
    const subVariant =
      tileVariant?.subVariants[
        pickTileSubVariantIndex(tileVariant.subVariants.length, {
          kind,
          worldX: posX,
          worldY: posY,
          eid,
        })
      ];
    const texture = tileVariant?.texture;
    const textureWidth = texture?.frame.width ?? 1;
    const textureHeight = texture?.frame.height ?? 1;
    const scaleX = (tileSize / textureWidth) * (subVariant?.reflectX ? -1 : 1);
    const scaleY = (tileSize / textureHeight) * (subVariant?.reflectY ? -1 : 1);

    sprite.anchor.set(0.5, 0.5);
    sprite.rotation = subVariant?.rotationRad ?? 0;
    sprite.scale.set(scaleX, scaleY);
    sprite.x = topLeft.x;
    sprite.y = topLeft.y;
    sprite.x += tileSize / 2;
    sprite.y += tileSize / 2;
    sprite.tint = tileVariant ? 0xffffff : kind === 'wall' ? 0x2f2f2f : 0x4b4b4b;
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
  if (kind === 'pointer') {
    const texture =
      (spriteKey ? assets.pointerCursorBySpriteKey.get(spriteKey) : undefined) ??
      assets.pointerCursor ??
      getPlaceholderTexture(renderer, assets, 'hero');
    if (sprite.texture !== texture) {
      sprite.texture = texture;
      setNearestScale(sprite.texture);
    }
    const pointerSize = tileSize;
    const pointerHotspotOffsetPx = tileSize / 16;
    sprite.anchor.set(0, 0);
    sprite.rotation = 0;
    sprite.scale.set(1, 1);
    sprite.width = pointerSize;
    sprite.height = pointerSize;
    sprite.x = posX * tileSize - pointerHotspotOffsetPx;
    sprite.y = -posY * tileSize - pointerHotspotOffsetPx;
    return;
  }
  if (kind === 'ball') {
    if (assets.soccerBallSheet) {
      updateSoccerBallSpriteFrame(sprite, assets.soccerBallSheet, eid, diameter, tileSize);
    } else {
      const texture =
        resolveFoodTexture(assets.foodTextureBySpriteKey, spriteKey) ??
        getPlaceholderTexture(renderer, assets, 'error');
      if (sprite.texture !== texture) {
        sprite.texture = texture;
        setNearestScale(sprite.texture);
      }
      const size = tileSize * diameter;
      sprite.width = size;
      sprite.height = size;
    }
  }
  if (kind === 'bot') {
    const texture =
      assets.botIdle ?? assets.icons.bot ?? getPlaceholderTexture(renderer, assets, 'bot');
    if (sprite.texture !== texture) {
      sprite.texture = texture;
      setNearestScale(sprite.texture);
    }
  }

  sprite.x = topLeft.x;
  sprite.y = topLeft.y;
  const verticalVelocity = hasComponent(world, eid, VelocityZ) ? (VelocityZ.z[eid] ?? 0) : 0;
  const airborne =
    (hasComponent(world, eid, Grounded) && (Grounded.value[eid] ?? 1) === 0) ||
    verticalVelocity > 0.05;
  const baseLiftTiles = getVerticalLiftTiles(world, eid);
  const visualLiftTiles = airborne ? baseLiftTiles * AIRBORNE_LIFT_EXAGGERATION : baseLiftTiles;
  sprite.y -= visualLiftTiles * tileSize;
  if (kind === 'food') {
    sprite.x = snapToVirtualPixel(sprite.x, tileSize);
    sprite.y = snapToVirtualPixel(sprite.y, tileSize);
  }
  if (kind === 'ball') {
    sprite.y += (tileSize / 16) * SOCCER_BALL_VERTICAL_OFFSET_VIRTUAL_PX;
    return;
  }

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
        Number.isFinite(Direction.angle[eid]) ? Direction.angle[eid] : undefined,
        isMoving,
        frame,
        diameter,
        tileSize
      );
      return;
    }
    if (assets.botIdle && assets.botWalk) {
      updateBotSpriteFrame(sprite, assets, facing, isMoving, frame, diameter, tileSize);
      return;
    }
  }

  const size = kind === 'error' ? tileSize : tileSize * diameter;
  sprite.width = size;
  sprite.height = size;
}

/**
 * Quantizes render-space coordinates to one virtual pixel (1/16 tile).
 */
export function snapToVirtualPixel(valuePx: number, tileSizePx: number): number {
  if (!Number.isFinite(valuePx) || !Number.isFinite(tileSizePx) || tileSizePx <= 0) {
    return valuePx;
  }
  const quantum = tileSizePx / 16;
  if (!Number.isFinite(quantum) || quantum <= 0) return valuePx;
  return Math.round(valuePx / quantum) * quantum;
}

/**
 * Computes upward visual lift from 3D state in tile units.
 * Ground level uses collider half-height so standing entities remain visually grounded.
 */
export function getVerticalLiftTiles(world: World, eid: number): number {
  const z = PositionZ.z[eid];
  if (!Number.isFinite(z)) return 0;

  const baseHeight = hasComponent(world, eid, ObstacleSize)
    ? Math.max(0, (ObstacleSize.diameter[eid] ?? 0) * 0.5)
    : hasComponent(world, eid, Size)
      ? Math.max(0, (Size.diameter[eid] ?? 0) * 0.5)
      : 0;

  return Math.max(0, z - baseHeight);
}

function shouldAllowWallVariant(
  spriteKey: string,
  worldX: number,
  worldY: number,
  _eid: number,
  spatialIndex?: RenderSpatialIndex
): boolean {
  if (spriteKey !== 'tile.wall.mouse-hole') return true;
  if (!spatialIndex) return false;
  const belowKey = `${Math.round(worldX)},${Math.round(worldY - 1)}`;
  return spatialIndex.floorCells.has(belowKey);
}

function shouldPickRareMouseHole(worldX: number, worldY: number, eid: number): boolean {
  const xi = Number.isFinite(worldX) ? Math.round(worldX) : eid;
  const yi = Number.isFinite(worldY) ? Math.round(worldY) : eid;
  let hash = ((xi * 2246822519) ^ (yi * 3266489917) ^ (eid * 668265263) ^ 0x9e3779b1) >>> 0;
  hash = (hash ^ (hash >>> 13)) >>> 0;
  hash = Math.imul(hash, 1274126177) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash % 10 === 0;
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

  // The 16x16 legacy bot sheet packs each frame on a 20x20 cell with 2px transparent inset.
  // Keep the same inset on X/Y so top/bottom rows do not get clipped by an accidental extra offset.
  const stride = SPRITE_SIZE + BOT_SHEET_FRAME_PADDING_PX * 2;
  const frameX = frameIndex * stride + BOT_SHEET_FRAME_PADDING_PX;
  const frameY = row * stride + BOT_SHEET_FRAME_PADDING_PX + 2;

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
    directionCount?: number;
    cardinalDirectionToGroup: {
      down: number;
      right: number;
      up: number;
      left: number;
    };
  },
  direction: 'up' | 'down' | 'left' | 'right',
  angleRad: number | undefined,
  isMoving: boolean,
  frameIndex: number,
  diameter: number,
  tileSize: number
): void {
  const row = isMoving ? animation.walkRow : animation.idleRow;
  const group = resolveActorVariantDirectionGroup(animation, direction, angleRad);
  const frameStep =
    ((frameIndex % animation.frameCount) + animation.frameCount) % animation.frameCount;
  const frameX =
    group * animation.frameCount * animation.framePitchX +
    frameStep * animation.framePitchX +
    animation.frameInsetX;
  const frameY = row * animation.framePitchY + animation.frameInsetY;
  const paddedFrameX = Math.max(0, frameX - ACTOR_FRAME_SAFE_PADDING_PX);
  const paddedFrameY = Math.max(0, frameY - ACTOR_FRAME_SAFE_PADDING_PX);
  const paddedFrameWidth = Math.min(
    animation.frameWidth + ACTOR_FRAME_SAFE_PADDING_PX * 2,
    sheet.frame.width - paddedFrameX
  );
  const paddedFrameHeight = Math.min(
    animation.frameHeight + ACTOR_FRAME_SAFE_PADDING_PX * 2,
    sheet.frame.height - paddedFrameY
  );

  sprite.texture = new Texture({
    source: sheet.source,
    frame: new Rectangle(paddedFrameX, paddedFrameY, paddedFrameWidth, paddedFrameHeight),
  });
  setNearestScale(sprite.texture);

  const baseScale = (tileSize / animation.frameWidth) * diameter;
  sprite.anchor.set(0, 0);
  sprite.pivot.x = ACTOR_FRAME_SAFE_PADDING_PX;
  sprite.pivot.y = ACTOR_FRAME_SAFE_PADDING_PX;
  sprite.scale.x = baseScale;
  sprite.scale.y = baseScale;
}

function resolveActorVariantDirectionGroup(
  animation: {
    directionCount?: number;
    cardinalDirectionToGroup: {
      down: number;
      right: number;
      up: number;
      left: number;
    };
  },
  direction: 'up' | 'down' | 'left' | 'right',
  angleRad: number | undefined
): number {
  const fallback = animation.cardinalDirectionToGroup[direction];
  if (!Number.isFinite(angleRad) || animation.directionCount !== 8) {
    return fallback;
  }
  const directionCount = 8;
  const groupByOctant = buildEightDirectionGroupMap(animation.cardinalDirectionToGroup);
  const tau = Math.PI * 2;
  const normalized = ((angleRad % tau) + tau) % tau;
  const octant = Math.round(normalized / (tau / 8)) % 8;
  return groupByOctant[octant] ?? fallback;
}

function buildEightDirectionGroupMap(cardinal: {
  down: number;
  right: number;
  up: number;
  left: number;
}): number[] {
  const n = 8;
  const map = new Array<number>(n);
  map[0] = mod(cardinal.right, n);
  map[2] = mod(cardinal.down, n);
  map[4] = mod(cardinal.left, n);
  map[6] = mod(cardinal.up, n);
  map[1] = midpointIndex(map[0], map[2], n);
  map[3] = midpointIndex(map[2], map[4], n);
  map[5] = midpointIndex(map[4], map[6], n);
  map[7] = midpointIndex(map[6], map[0], n);
  return map;
}

function midpointIndex(a: number, b: number, n: number): number {
  let diff = mod(b - a, n);
  if (diff > n / 2) diff -= n;
  return mod(a + Math.round(diff / 2), n);
}

function mod(value: number, n: number): number {
  return ((value % n) + n) % n;
}

function updateSoccerBallSpriteFrame(
  sprite: Sprite,
  sheet: Texture,
  eid: number,
  diameter: number,
  tileSize: number
): void {
  const anySprite = sprite as Sprite & {
    __ballRollPhase?: number;
    __ballRollRow?: number;
  };

  const currentX = Position.x[eid];
  const currentY = Position.y[eid];
  const prevX = Number.isFinite(PreviousPosition.x[eid]) ? PreviousPosition.x[eid] : currentX;
  const prevY = Number.isFinite(PreviousPosition.y[eid]) ? PreviousPosition.y[eid] : currentY;
  const dx = currentX - prevX;
  const dy = currentY - prevY;
  const distanceTiles = Math.hypot(dx, dy);

  let rollPhase = anySprite.__ballRollPhase ?? 0;
  let rollRow = anySprite.__ballRollRow ?? 0;

  if (distanceTiles > 0.0001) {
    rollPhase += distanceTiles * SOCCER_BALL_ROLL_FRAMES_PER_TILE;
    rollRow = directionToRow(dx, dy, SOCCER_BALL_SHEET_LAYOUT.rows, rollRow);
  }

  anySprite.__ballRollPhase = rollPhase;
  anySprite.__ballRollRow = rollRow;

  const col =
    ((Math.floor(rollPhase) % SOCCER_BALL_SHEET_LAYOUT.columns) +
      SOCCER_BALL_SHEET_LAYOUT.columns) %
    SOCCER_BALL_SHEET_LAYOUT.columns;
  const frameX = col * SOCCER_BALL_SHEET_LAYOUT.frameWidth;
  const frameY = rollRow * SOCCER_BALL_SHEET_LAYOUT.frameHeight;

  sprite.texture = new Texture({
    source: sheet.source,
    frame: new Rectangle(
      frameX,
      frameY,
      SOCCER_BALL_SHEET_LAYOUT.frameWidth,
      SOCCER_BALL_SHEET_LAYOUT.frameHeight
    ),
  });
  setNearestScale(sprite.texture);

  const baseScale = (tileSize / SOCCER_BALL_SHEET_LAYOUT.frameWidth) * diameter;
  sprite.anchor.set(0, 0);
  sprite.pivot.x = 0;
  sprite.pivot.y = 0;
  sprite.scale.x = baseScale;
  sprite.scale.y = baseScale;
}

function directionToRow(dx: number, dy: number, rows: number, fallback: number): number {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || rows <= 0) return fallback;
  const length = Math.hypot(dx, dy);
  if (length <= 1e-6) return fallback;
  const angle = Math.atan2(dy, dx);
  const normalized = ((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
  const row = Math.floor(normalized * rows);
  return Math.max(0, Math.min(rows - 1, row));
}
