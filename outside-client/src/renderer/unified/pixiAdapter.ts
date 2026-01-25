import { Container, Graphics } from 'pixi.js';
import type { DisplayObject } from 'pixi.js';

import type { Renderable } from './renderables';
import { COORDINATE_SYSTEM, CoordinateConverter, getZoomScale } from '../coordinateSystem';

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
 * - Uses simple Graphics placeholders (no textures yet)
 * - Keeps all display objects under the provided root container
 * - Intended for Phase 2 wiring + Phase 3 parity work
 */
export function createPixiDisplayAdapter(root: Container) {
  return {
    create(renderable: Renderable): DisplayObject {
      // Use Graphics for both bots and terrain for now; asset resolution comes later.
      const g = new Graphics();
      // Keep interaction off for now; parity/selection comes later.
      g.eventMode = 'none';
      root.addChild(g);
      return g;
    },

    update(display: DisplayObject, renderable: Renderable): void {
      const g = display as Graphics;
      g.clear();

      const zoomScale = getZoomScale();
      const displayPos = CoordinateConverter.gridToDisplay(renderable.position, zoomScale);
      g.x = displayPos.x;
      g.y = displayPos.y;

      if (renderable.kind === 'bot') {
        // Bot placeholder: circle centered in the tile. Apply vertical offset like legacy pipeline.
        const size = COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;
        const radius = size / 4;
        const centerX = size / 2;
        const centerY = size / 2;

        g.circle(centerX, centerY, radius);
        g.fill(0xffffff);
        g.y += COORDINATE_SYSTEM.VERTICAL_OFFSET;
      } else {
        // Terrain placeholder: solid rect sized to terrain rectangle (in tiles).
        const widthTiles = renderable.size?.width ?? 1;
        const heightTiles = renderable.size?.height ?? 1;
        const pxW = widthTiles * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;
        const pxH = heightTiles * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * zoomScale;

        g.rect(0, 0, pxW, pxH);
        g.fill(getTerrainColor(renderable.sprite.textureKey));
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

