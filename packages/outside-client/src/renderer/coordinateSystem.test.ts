import { describe, it, expect } from 'vitest';
import { CoordinateConverter, COORDINATE_SYSTEM } from './coordinateSystem';

describe('CoordinateSystem', () => {
  describe('Constants', () => {
    it('should have correct default values', () => {
      expect(COORDINATE_SYSTEM.VIRTUAL_TILE_SIZE).toBe(16);
      expect(COORDINATE_SYSTEM.DISPLAY_TILE_SIZE).toBe(64);
      expect(COORDINATE_SYSTEM.VIRTUAL_TO_DISPLAY_RATIO).toBe(4);
    });
  });

  describe('Grid <-> Display Conversion', () => {
    it('should convert grid origin to display origin', () => {
      const grid = { x: 0, y: 0 };
      const display = CoordinateConverter.gridToDisplay(grid);
      expect(display).toEqual({ x: 0, y: 0 });
    });

    it('should convert grid position to display pixels', () => {
      const grid = { x: 2, y: 3 };
      const display = CoordinateConverter.gridToDisplay(grid);
      expect(display).toEqual({
        x: 2 * 64, // 128
        y: 3 * 64, // 192
      });
    });

    it('should convert display pixels to grid position (floored)', () => {
      const display = { x: 130, y: 200 }; // Slightly inside (2, 3)
      const grid = CoordinateConverter.displayToGrid(display);
      expect(grid).toEqual({ x: 2, y: 3 });
    });
  });

  describe('World <-> Display Conversion (Floating Point)', () => {
    it('should convert floating world position to precise display pixels', () => {
      const world = { x: 2.5, y: 3.5 }; // Center of tile (2, 3)
      const display = CoordinateConverter.worldToDisplay(world);
      expect(display).toEqual({
        x: 2.5 * 64, // 160
        y: 3.5 * 64, // 224
      });
    });

    it('should convert display pixels to floating world position', () => {
      const display = { x: 160, y: 224 };
      const world = CoordinateConverter.displayToWorld(display);
      expect(world).toEqual({ x: 2.5, y: 3.5 });
    });
  });

  describe('Sub-grid Operations', () => {
    it('should calculate tile center correctly', () => {
      const center = CoordinateConverter.getTileCenter(2, 3);
      expect(center).toEqual({ x: 2.5, y: 3.5 });
    });

    it('should snap world position to nearest grid center', () => {
      const world = { x: 2.1, y: 3.9 };
      const snapped = CoordinateConverter.snapToGrid(world);
      expect(snapped).toEqual({ x: 2.5, y: 3.5 });
    });

    it('should decompose world position into sub-tile components', () => {
      const world = { x: 2.25, y: 3.75 };
      const sub = CoordinateConverter.toSubTilePosition(world);
      expect(sub.tileX).toBe(2);
      expect(sub.tileY).toBe(3);
      expect(sub.offsetX).toBeCloseTo(0.25);
      expect(sub.offsetY).toBeCloseTo(0.75);
    });

    it('should convert to 8x8 sub-grid coordinates', () => {
      // 0.125 is 1/8th. So 0.125 is the edge of the first sub-cell.
      // 0.0625 is the center of the first sub-cell (index 0).

      const world = { x: 2.0, y: 3.0 }; // Top-left corner
      const sub8 = CoordinateConverter.toSubGrid8(world);
      expect(sub8).toEqual({ tileX: 2, tileY: 3, subX: 0, subY: 0 });

      const worldCenter = { x: 2.5, y: 3.5 }; // Center of tile
      const sub8Center = CoordinateConverter.toSubGrid8(worldCenter);
      // Center is at 4/8 = 0.5. So it's start of index 4.
      expect(sub8Center).toEqual({ tileX: 2, tileY: 3, subX: 4, subY: 4 });
    });

    it('should snap to nearest 8x8 sub-grid center', () => {
      const world = { x: 2.01, y: 3.01 }; // Near top-left
      const snapped = CoordinateConverter.snapToSubGrid8(world);

      // Center of first sub-cell (0) is at 0.5/8 = 0.0625
      const expectedOffset = 0.5 / 8;

      expect(snapped.x).toBeCloseTo(2 + expectedOffset);
      expect(snapped.y).toBeCloseTo(3 + expectedOffset);
    });
  });

  describe('Screen to World Conversion', () => {
    it('should account for root container offset', () => {
      const rootPos = { x: 100, y: 50 };
      const screen = { x: 228, y: 242 }; // (128 + 100, 192 + 50) -> matches grid (2, 3)

      const world = CoordinateConverter.screenToWorld(screen, rootPos);
      expect(world.x).toBe(2);
      expect(world.y).toBe(3);
    });
  });
});
