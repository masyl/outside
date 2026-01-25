import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite, type Renderer } from 'pixi.js';

import type { Renderable } from './renderables';
import { COORDINATE_SYSTEM, CoordinateConverter, getZoomScale } from '../coordinateSystem';
import { createBotPlaceholder, createBotSprite, updateBotSpriteFrame } from '../objects';

function getTerrainColor(textureKey: string): number {
  // textureKey format: "terrain:<type>"
  const [, terrainType] = textureKey.split(':');
  switch (terrainType) {
    case 'grass':
      return 0x00ff00;
    case 'dirt':
      return 0x8b4513;
    case 'water':
      return 0x0000ff;
    case 'sand':
      return 0xf5deb3;
    case 'hole':
      return 0x000000;
    default:
      return 0x808080;
  }
}

/**
 * Minimal Pixi adapter for the unified renderer.
 *
 * - Uses real textures when available, with safe placeholders otherwise
 * - Keeps all display objects under the provided root container
 * - Intended for Phase 2 wiring + Phase 3 parity work
 */
export function createPixiDisplayAdapter(
  root: Container,
  opts: {
    getBotTexture: () => Texture | undefined;
    getBotWalkTexture: () => Texture | undefined;
    getBotFacing: (id: string) => import('@outside/core').Direction;
    getBotIsMoving: (id: string) => boolean;
    getBotWalkFrameIndex: (id: string) => number;
    getTerrainTexture: () => Texture | undefined;
    renderer: Renderer;
  }
) {
  return {
    create(renderable: Renderable): Container {
      // Use a stable Container wrapper so we can swap child visuals when assets become available.
      const g = new Container();
      // Keep interaction off for now; parity/selection comes later.
      g.eventMode = 'none';
      root.addChild(g);
      return g;
    },

    update(c: Container, renderable: Renderable): void {
      const zoomScale = getZoomScale();
      const displayPos = CoordinateConverter.gridToDisplay(renderable.position, zoomScale);

      if (renderable.kind === 'bot') {
        const targetX = displayPos.x;
        const targetY = displayPos.y + COORDINATE_SYSTEM.VERTICAL_OFFSET;
        const anyC: any = c as any;
        anyC.__targetX = targetX;
        anyC.__targetY = targetY;
        if (anyC.__hasPos !== true) {
          c.x = targetX;
          c.y = targetY;
          anyC.__hasPos = true;
        }

        const idleTexture = opts.getBotTexture();
        const walkTexture = opts.getBotWalkTexture();

        const existing = c.children[0];
        let sprite: Sprite;

        if (existing instanceof Sprite) {
          sprite = existing;
        } else {
          c.removeChildren().forEach((child) => child.destroy({ children: true }));
          sprite = idleTexture ? createBotSprite(idleTexture) : createBotPlaceholder(opts.renderer);
          c.addChild(sprite);
        }

        if (idleTexture && walkTexture && sprite.texture.source === idleTexture.source) {
          const direction = opts.getBotFacing(renderable.id);
          const isMoving = opts.getBotIsMoving(renderable.id);
          const frameIndex = opts.getBotWalkFrameIndex(renderable.id);
          updateBotSpriteFrame(sprite, idleTexture, walkTexture, direction, isMoving, frameIndex);
        } else if (idleTexture && sprite.texture.source !== idleTexture.source) {
          // Upgrade placeholder -> textured sprite once assets load.
          c.removeChildren().forEach((child) => child.destroy({ children: true }));
          sprite = createBotSprite(idleTexture);
          c.addChild(sprite);

          if (walkTexture) {
            const direction = opts.getBotFacing(renderable.id);
            const isMoving = opts.getBotIsMoving(renderable.id);
            const frameIndex = opts.getBotWalkFrameIndex(renderable.id);
            updateBotSpriteFrame(sprite, idleTexture, walkTexture, direction, isMoving, frameIndex);
          } else {
            // At least apply zoom if walk texture isn't available yet.
            sprite.scale.set(sprite.scale.x * zoomScale, sprite.scale.y * zoomScale);
          }
        } else if (!idleTexture) {
          // Placeholder is 64x64 already; scale by zoom.
          sprite.scale.set(zoomScale, zoomScale);
        }

      } else {
        // Terrain is not smoothed; snap to exact position.
        c.x = displayPos.x;
        c.y = displayPos.y;

        // Terrain: clear children and rebuild visuals (simple, safe; optimize later).
        c.removeChildren().forEach((child) => child.destroy({ children: true }));

        const widthTiles = renderable.size?.width ?? 1;
        const heightTiles = renderable.size?.height ?? 1;
        const terrainTexture = opts.getTerrainTexture();

        const visual = terrainTexture
          ? createTerrainVisual(renderable.sprite.textureKey, widthTiles, heightTiles, terrainTexture)
          : createTerrainFallback(widthTiles, heightTiles, renderable.sprite.textureKey);

        // Terrain sprites already incorporate zoom in their own sizing.
        c.addChild(visual);
      }
    },

    destroy(display: Container): void {
      root.removeChild(display);
      display.destroy();
    },

    setZIndex(display: Container, z: number): void {
      // Note: zIndex requires container.sortableChildren = true on the parent.
      (display as any).zIndex = z;
    },
  } as const;
}

function createTerrainFallback(
  widthTiles: number,
  heightTiles: number,
  textureKey: string
): Graphics {
  const zoomScale = getZoomScale();
  const pxW = widthTiles * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;
  const pxH = heightTiles * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;
  const g = new Graphics();
  g.rect(0, 0, pxW, pxH);
  g.fill(getTerrainColor(textureKey));
  return g;
}

function createTerrainVisual(
  textureKey: string,
  widthTiles: number,
  heightTiles: number,
  terrainTexture: Texture
): Sprite | TilingSprite | Graphics {
  // Mirror legacy mapping from terrain.ts (only grass/water supported for now).
  const [, terrainType] = textureKey.split(':');

  let tileX = -1;
  let tileY = -1;
  if (terrainType === 'grass') {
    tileX = 16;
    tileY = 16;
  } else if (terrainType === 'water') {
    tileX = 64;
    tileY = 48;
  }

  if (tileX < 0 || tileY < 0) {
    return createTerrainFallback(widthTiles, heightTiles, textureKey);
  }

  const tileTexture = new Texture({
    source: terrainTexture.source,
    frame: new Rectangle(tileX, tileY, 16, 16),
  });

  const zoomScale = getZoomScale();
  const width = widthTiles * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;
  const height = heightTiles * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;

  const sprite = new TilingSprite({
    texture: tileTexture,
    width,
    height,
  });

  // Scale the 16x16 texture up to 64x64, considering zoom scale.
  sprite.tileScale.set(4 * zoomScale, 4 * zoomScale);

  return sprite;
}

