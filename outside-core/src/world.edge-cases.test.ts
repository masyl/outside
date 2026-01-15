import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldState,
  createGroundLayer,
  addTerrainObject,
  removeTerrainObject,
  getObjectAtPosition,
  placeObjectInGrid,
  removeObjectFromGrid,
  doesTerrainCoverPosition,
} from './world';
import { TerrainType, GameObject } from './types';

describe('World State Management - Edge Cases', () => {
  let world: ReturnType<typeof createWorldState>;

  beforeEach(() => {
    world = createWorldState(42);
  });

  describe('removeTerrainObject Edge Cases', () => {
    it('should handle removal of non-existent terrain ID gracefully', () => {
      const nonExistentId = 'non-existent-terrain';

      // Should not throw error
      expect(() => {
        removeTerrainObject(world.groundLayer, nonExistentId);
      }).not.toThrow();

      // Ground layer should remain unchanged
      expect(world.groundLayer.terrainObjects.size).toBe(0);
      expect(world.groundLayer.terrainObjectsByPosition.size).toBe(0);
    });

    it('should clean up empty position arrays after removal', () => {
      const terrain = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 1,
        height: 1,
        createdAt: Date.now(),
      };

      addTerrainObject(world.groundLayer, terrain);

      // Verify terrain was added
      expect(world.groundLayer.terrainObjectsByPosition.get('5,3')).toHaveLength(1);

      // Remove terrain
      removeTerrainObject(world.groundLayer, 'terrain-1');

      // Position array should be cleaned up (not empty array)
      expect(world.groundLayer.terrainObjectsByPosition.has('5,3')).toBe(false);
      expect(world.groundLayer.terrainObjectsByPosition.get('5,3')).toBeUndefined();
    });

    it('should handle terrain removal when other terrain remains at position', () => {
      const terrain1 = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 1,
        height: 1,
        createdAt: 1000,
      };

      const terrain2 = {
        id: 'terrain-2',
        type: 'dirt' as TerrainType,
        position: { x: 5, y: 3 },
        width: 1,
        height: 1,
        createdAt: 2000,
      };

      // Add both terrain objects
      addTerrainObject(world.groundLayer, terrain1);
      addTerrainObject(world.groundLayer, terrain2);

      // Verify both are added
      expect(world.groundLayer.terrainObjectsByPosition.get('5,3')).toHaveLength(2);

      // Remove only terrain1
      removeTerrainObject(world.groundLayer, 'terrain-1');

      // Position should still exist with terrain2
      expect(world.groundLayer.terrainObjectsByPosition.has('5,3')).toBe(true);
      expect(world.groundLayer.terrainObjectsByPosition.get('5,3')).toHaveLength(1);
      expect(world.groundLayer.terrainObjectsByPosition.get('5,3')?.[0].id).toBe('terrain-2');
    });
  });

  describe('getObjectAtPosition Edge Cases', () => {
    it('should return null for invalid coordinates', () => {
      // Test negative coordinates
      expect(getObjectAtPosition(world, { x: -1, y: 0 })).toBeNull();
      expect(getObjectAtPosition(world, { x: 0, y: -1 })).toBeNull();

      // Test out-of-bounds coordinates
      expect(getObjectAtPosition(world, { x: 20, y: 0 })).toBeNull();
      expect(getObjectAtPosition(world, { x: 0, y: 10 })).toBeNull();
      expect(getObjectAtPosition(world, { x: 25, y: 15 })).toBeNull();
    });

    it('should return null for boundary edge cases', () => {
      // Test exactly on boundary
      expect(getObjectAtPosition(world, { x: 20, y: 9 })).toBeNull();
      expect(getObjectAtPosition(world, { x: 19, y: 10 })).toBeNull();
      expect(getObjectAtPosition(world, { x: 20, y: 10 })).toBeNull();
    });

    it('should return null when position is empty', () => {
      expect(getObjectAtPosition(world, { x: 5, y: 3 })).toBeNull();
    });

    it('should return object when position is occupied', () => {
      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      placeObjectInGrid(world.grid, object, { x: 5, y: 3 });

      const retrieved = getObjectAtPosition(world, { x: 5, y: 3 });
      expect(retrieved).toBe(object);
    });
  });

  describe('Grid Operations Edge Cases', () => {
    it('should handle boundary conditions in placeObjectInGrid', () => {
      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 0, y: 0 },
      };

      // Place at exact boundaries
      placeObjectInGrid(world.grid, object, { x: 19, y: 9 });
      expect(world.grid[9][19]).toBe(object);

      // Place outside boundaries (should be ignored gracefully)
      placeObjectInGrid(
        world.grid,
        { id: 'bot-2', type: 'bot', position: { x: 0, y: 0 } },
        { x: 20, y: 0 }
      );
      expect(world.grid[0][20]).toBeUndefined(); // Out of bounds, not modified

      placeObjectInGrid(
        world.grid,
        { id: 'bot-3', type: 'bot', position: { x: 0, y: 0 } },
        { x: 0, y: 10 }
      );
      expect(world.grid[10]).toBeUndefined(); // Out of bounds, not modified
    });

    it('should safely remove from invalid positions', () => {
      // Pre-populate a valid position
      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 5, y: 3 },
      };
      placeObjectInGrid(world.grid, object, { x: 5, y: 3 });

      // Remove from valid position
      removeObjectFromGrid(world.grid, { x: 5, y: 3 });
      expect(world.grid[3][5]).toBeNull();

      // Attempt to remove from invalid positions (should not throw)
      expect(() => {
        removeObjectFromGrid(world.grid, { x: -1, y: 0 });
        removeObjectFromGrid(world.grid, { x: 20, y: 0 });
        removeObjectFromGrid(world.grid, { x: 0, y: 10 });
      }).not.toThrow();
    });

    it('should handle overlapping terrain coverage', () => {
      const terrain1 = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 3,
        height: 2,
        createdAt: 1000,
      };

      const terrain2 = {
        id: 'terrain-2',
        type: 'water' as TerrainType,
        position: { x: 6, y: 4 },
        width: 1,
        height: 1,
        createdAt: 2000,
      };

      addTerrainObject(world.groundLayer, terrain1);
      addTerrainObject(world.groundLayer, terrain2);

      // Check overlapping positions
      expect(doesTerrainCoverPosition(terrain1, { x: 6, y: 4 })).toBe(true);
      expect(doesTerrainCoverPosition(terrain2, { x: 6, y: 4 })).toBe(true);

      // Verify position index has both terrain objects
      const objectsAtOverlap = world.groundLayer.terrainObjectsByPosition.get('6,4');
      expect(objectsAtOverlap).toHaveLength(2);
      expect(objectsAtOverlap?.map((t) => t.id)).toEqual(['terrain-1', 'terrain-2']);
    });
  });
});
