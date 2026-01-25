import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite, type Renderer } from 'pixi.js';
import type { DisplayObject } from 'pixi.js';

import type { Renderable } from './renderables';
import { COORDINATE_SYSTEM, CoordinateConverter, getZoomScale } from '../coordinateSystem';
import { createBotPlaceholder, createBotSprite } from '../objects';

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
    getTerrainTexture: () => Texture | undefined;
    renderer: Renderer;
  }
) {
  return {
    create(renderable: Renderable): DisplayObject {
      // Use a stable Container wrapper so we can swap child visuals when assets become available.
      const g = new Container();
      // Keep interaction off for now; parity/selection comes later.
      g.eventMode = 'none';
      root.addChild(g);
      return g;
    },

    update(display: DisplayObject, renderable: Renderable): void {
      const c = display as Container;
      // Clear children and rebuild visuals (simple, safe; optimize later).
      c.removeChildren().forEach((child) => child.destroy({ children: true }));

      const zoomScale = getZoomScale();
      const displayPos = CoordinateConverter.gridToDisplay(renderable.position, zoomScale);
      c.x = displayPos.x;
      c.y = displayPos.y;

      if (renderable.kind === 'bot') {
        const botTexture = opts.getBotTexture();
        const sprite = botTexture ? createBotSprite(botTexture) : createBotPlaceholder(opts.renderer);
        c.addChild(sprite);
        c.y += COORDINATE_SYSTEM.VERTICAL_OFFSET;
      } else {
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

    destroy(display: DisplayObject): void {
      root.removeChild(display);
      display.destroy();
    },

    setZIndex(display: DisplayObject, z: number): void {
      // Note: zIndex requires container.sortableChildren = true on the parent.
      (display as any).zIndex = z;
    },
  } as const;
}

function createTerrainFallback(
  widthTiles: number,
  heightTiles: number,
  textureKey: string
): DisplayObject {
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
): DisplayObject {
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

