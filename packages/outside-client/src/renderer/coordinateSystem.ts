import { getCurrentZoomScale } from '../zoom/zoomScaleService';

/**
 * Core coordinate system for the game
 *
 * Coordinate Concepts:
 * 1. World Coordinates (Floating Point):
 *    - Integer part = Grid Tile index (0, 1, 2...)
 *    - Fractional part = Position within tile (0.0 to <1.0)
 *    - Example: { x: 2.5, y: 1.5 } is center of tile (2,1)
 *
 * 2. Grid Coordinates (Integer):
 *    - Tile indices only
 *    - Example: { x: 2, y: 1 }
 *
 * 3. Display Coordinates (Pixels):
 *    - Screen rendering units
 *    - Example: { x: 2.5, y: 1.5 } is center of tile (2,1)
 *
 * 4. Screen Coordinates (Browser Window):
 *    - Browser window coordinates
 *    - Used for mouse events and viewport calculations
 */

/**
 * Core coordinate system for the game
 *
 * Coordinate Concepts:
 * 1. World Coordinates (Floating Point):
 *    - Integer part = Grid Tile index (0, 1, 2...)
 *    - Fractional part = Position within tile (0.0 to <1.0)
 *    - Example: { x: 2.5, y: 1.5 } is center of tile (2,1)
 *
 * 2. Grid Coordinates (Integer):
 *    - Tile indices only
 *
 * 3. Display Coordinates (Pixels):
 *    - Screen rendering units
 *    - Example: { x: 2.5, y: 1.5 } is center of tile (2,1)
 *
 * 4. Screen Coordinates (Browser Window):
 *    - Browser window coordinates
 *    - Used for mouse events and viewport calculations
 */
export const COORDINATE_SYSTEM = {
  // Base virtual tile size (game logic coordinates)
  VIRTUAL_TILE_SIZE: 16,

  // Display tile size (rendered coordinates)
  DISPLAY_TILE_SIZE: 64,

  // Conversion ratios
  VIRTUAL_TO_DISPLAY_RATIO: 4,
  DISPLAY_TO_VIRTUAL_RATIO: 0.25,

  // Rendering constants
  VERTICAL_OFFSET: -8, // Consistent vertical positioning
  VIRTUAL_PIXEL: 2, // For crisp 1px lines
} as const;

/**
 * Get current zoom scale from zoom manager
 * This is a convenience function that can be called from components
 */
export function getZoomScale(): number {
  return getCurrentZoomScale();
}

/**
 * World Position - Single source of truth for entity positioning
 * Floating point coordinates where integer = tile, fraction = offset
 */
export type WorldPosition = {
  x: number;
  y: number;
};

/**
 * Grid Position - Integer tile coordinates
 */
export type GridPosition = {
  x: number;
  y: number;
};

/**
 * Display Position - Rendered pixel coordinates
 */
export type DisplayPosition = {
  x: number;
  y: number;
};

/**
 * Sub-tile Position - Decomposed for utility operations
 */
export interface SubTilePosition {
  tileX: number; // Integer tile coordinate
  tileY: number; // Integer tile coordinate
  offsetX: number; // 0.0 to <1.0 within tile
  offsetY: number; // 0.0 to <1.0 within tile
}

/**
 * 8x8 Sub-grid Position - For precise sub-tile operations
 */
export type SubGrid8Position = {
  tileX: number; // Main tile coordinate
  tileY: number; // Main tile coordinate
  subX: number; // 0-7 position within tile
  subY: number; // 0-7 position within tile
};

/**
 * Coordinate Converter Utility Class
 */
export class CoordinateConverter {
  /**
   * Convert Grid to Display coordinates (Top-Left of tile)
   */
  static gridToDisplay(grid: GridPosition, zoomScale: number = 1.0): DisplayPosition {
    const scale = zoomScale;
    return {
      x: grid.x * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * scale,
      y: grid.y * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * scale,
    };
  }

  /**
   * Convert Display to Grid coordinates with zoom support
   */
  static displayToGrid(display: DisplayPosition, zoomScale: number = 1.0): GridPosition {
    const scale = zoomScale;
    return {
      x: Math.floor(display.x / COORDINATE_SYSTEM.DISPLAY_TILE_SIZE / scale),
      y: Math.floor(display.y / COORDINATE_SYSTEM.DISPLAY_TILE_SIZE / scale),
    };
  }

  /**
   * Convert World to Display coordinates with zoom support
   */
  static worldToDisplay(world: WorldPosition, zoomScale: number = 1.0): DisplayPosition {
    const scale = zoomScale;
    return {
      x: world.x * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * scale,
      y: world.y * COORDINATE_SYSTEM.DISPLAY_TILE_SIZE * scale,
    };
  }

  /**
   * Convert Display to World coordinates with zoom support
   */
  static displayToWorld(display: DisplayPosition, zoomScale: number = 1.0): WorldPosition {
    const scale = zoomScale;
    return {
      x: display.x / COORDINATE_SYSTEM.DISPLAY_TILE_SIZE / scale,
      y: display.y / COORDINATE_SYSTEM.DISPLAY_TILE_SIZE / scale,
    };
  }

  /**
   * Convert Screen to World coordinates (accounting for root container offset)
   */
  static screenToWorld(
    screen: { x: number; y: number },
    rootPos: { x: number; y: number },
    zoomScale: number = 1.0
  ): WorldPosition {
    const scale = zoomScale;
    return {
      x: (screen.x - rootPos.x) / COORDINATE_SYSTEM.DISPLAY_TILE_SIZE / scale,
      y: (screen.y - rootPos.y) / COORDINATE_SYSTEM.DISPLAY_TILE_SIZE / scale,
    };
  }

  /**
   * Get integer Grid position from World position
   */
  static getGridPosition(pos: WorldPosition): GridPosition {
    return {
      x: Math.floor(pos.x),
      y: Math.floor(pos.y),
    };
  }

  /**
   * Get center of a tile in World coordinates
   */
  static getTileCenter(tileX: number, tileY: number, zoomScale: number = 1.0): WorldPosition {
    return {
      x: tileX + 0.5,
      y: tileY + 0.5,
    };
  }

  /**
   * Decompose World position into tile and sub-tile offset
   */
  static toSubTilePosition(pos: WorldPosition): SubTilePosition {
    const tileX = Math.floor(pos.x);
    const tileY = Math.floor(pos.y);
    return {
      tileX,
      tileY,
      offsetX: pos.x - tileX,
      offsetY: pos.y - tileY,
    };
  }

  /**
   * Convert World position to 8x8 sub-grid
   */
  static toSubGrid8(pos: WorldPosition): SubGrid8Position {
    const sub = this.toSubTilePosition(pos);
    return {
      tileX: sub.tileX,
      tileY: sub.tileY,
      subX: Math.floor(sub.offsetX * 8),
      subY: Math.floor(sub.offsetY * 8),
    };
  }

  /**
   * Get current zoom scale from zoom scale service
   */
  /**
   * Convert 8x8 sub-grid to World position (Center of sub-cell)
   */
  static fromSubGrid8(sub: SubGrid8Position): WorldPosition {
    return {
      x: sub.tileX + (sub.subX + 0.5) / 8,
      y: sub.tileY + (sub.subY + 0.5) / 8,
    };
  }

  /**
   * Snap World position to nearest Grid center
   */
  static snapToGrid(pos: WorldPosition): WorldPosition {
    return {
      x: Math.floor(pos.x) + 0.5,
      y: Math.floor(pos.y) + 0.5,
    };
  }

  /**
   * Snap World position to nearest 8x8 sub-grid center
   */
  static snapToSubGrid8(pos: WorldPosition): WorldPosition {
    const sub8 = this.toSubGrid8(pos);
    return this.fromSubGrid8(sub8);
  }
}
