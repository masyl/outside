import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorldState,
  createGroundLayer,
  doesTerrainCoverPosition,
  getTerrainObjectsAtPosition,
  getTopMostTerrainAtPosition,
  isTerrainTypeWalkable,
  isWalkable,
  addTerrainObject,
  removeTerrainObject,
  isValidPosition,
  isPositionOccupied,
  getObjectAtPosition,
  placeObjectInGrid,
  removeObjectFromGrid,
} from './world';
import { TerrainType, GameObject } from './types';

describe('World State Management', () => {
  let world: ReturnType<typeof createWorldState>;

  beforeEach(() => {
    world = createWorldState(42);
  });

  describe('createWorldState', () => {
    it('should create world with correct limits', () => {
      expect(world.horizontalLimit).toBe(30);
      expect(world.verticalLimit).toBe(30);
    });

    it('should create empty grid', () => {
      const gridSize = 30 * 2 + 1; // 61
      expect(world.grid).toHaveLength(gridSize);
      expect(world.grid[0]).toHaveLength(gridSize);
      expect(world.grid[0][0]).toBeNull();
    });

    it('should use provided seed', () => {
      const seededWorld = createWorldState(123);
      expect(seededWorld.seed).toBe(123);
    });

    it('should generate random seed if not provided', () => {
      const randomWorld = createWorldState();
      expect(randomWorld.seed).toBeGreaterThan(0);
      expect(randomWorld.seed).toBeLessThan(2147483647);
    });
  });

  describe('createGroundLayer', () => {
    it('should create empty ground layer', () => {
      const groundLayer = createGroundLayer();
      expect(groundLayer.terrainObjects.size).toBe(0);
      expect(groundLayer.terrainObjectsByPosition.size).toBe(0);
    });
  });

  describe('Terrain Coverage', () => {
    it('should detect terrain covering position', () => {
      const terrain = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 2,
        height: 2,
        createdAt: Date.now(),
      };

      expect(doesTerrainCoverPosition(terrain, { x: 5, y: 3 })).toBe(true);
      expect(doesTerrainCoverPosition(terrain, { x: 6, y: 4 })).toBe(true);
      expect(doesTerrainCoverPosition(terrain, { x: 4, y: 3 })).toBe(false);
      expect(doesTerrainCoverPosition(terrain, { x: 7, y: 3 })).toBe(false);
    });
  });

  describe('Terrain Management', () => {
    it('should add and retrieve terrain objects', () => {
      const terrain = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 2,
        height: 2,
        createdAt: Date.now(),
      };

      addTerrainObject(world.groundLayer, terrain);

      expect(getTerrainObjectsAtPosition(world.groundLayer, { x: 5, y: 3 })).toContain(terrain);
      expect(getTerrainObjectsAtPosition(world.groundLayer, { x: 6, y: 4 })).toContain(terrain);
      expect(getTerrainObjectsAtPosition(world.groundLayer, { x: 4, y: 3 })).toHaveLength(0);
    });

    it('should get top-most terrain at position', () => {
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

      addTerrainObject(world.groundLayer, terrain1);
      addTerrainObject(world.groundLayer, terrain2);

      const topMost = getTopMostTerrainAtPosition(world.groundLayer, { x: 5, y: 3 });
      expect(topMost).toBe(terrain2);
    });

    it('should remove terrain objects', () => {
      const terrain = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 2,
        height: 2,
        createdAt: Date.now(),
      };

      addTerrainObject(world.groundLayer, terrain);
      expect(getTerrainObjectsAtPosition(world.groundLayer, { x: 5, y: 3 })).toContain(terrain);

      removeTerrainObject(world.groundLayer, 'terrain-1');
      expect(getTerrainObjectsAtPosition(world.groundLayer, { x: 5, y: 3 })).toHaveLength(0);
    });
  });

  describe('Walkability', () => {
    it('should determine walkable terrain types', () => {
      expect(isTerrainTypeWalkable('grass')).toBe(true);
      expect(isTerrainTypeWalkable('dirt')).toBe(true);
      expect(isTerrainTypeWalkable('sand')).toBe(true);
      expect(isTerrainTypeWalkable('water')).toBe(false);
      expect(isTerrainTypeWalkable('hole')).toBe(false);
    });

    it('should determine if position is walkable', () => {
      const walkableTerrain = {
        id: 'terrain-1',
        type: 'grass' as TerrainType,
        position: { x: 5, y: 3 },
        width: 1,
        height: 1,
        createdAt: Date.now(),
      };

      const unwalkableTerrain = {
        id: 'terrain-2',
        type: 'water' as TerrainType,
        position: { x: 6, y: 3 },
        width: 1,
        height: 1,
        createdAt: Date.now(),
      };

      addTerrainObject(world.groundLayer, walkableTerrain);
      addTerrainObject(world.groundLayer, unwalkableTerrain);

      expect(isWalkable(world, { x: 5, y: 3 })).toBe(true);
      expect(isWalkable(world, { x: 6, y: 3 })).toBe(false);
      expect(isWalkable(world, { x: 0, y: 0 })).toBe(false); // No terrain
      expect(isWalkable(world, { x: -1, y: 0 })).toBe(false); // Invalid position
    });
  });

  describe('Position Validation', () => {
    it('should validate positions within bounds', () => {
      expect(isValidPosition(world, { x: 0, y: 0 })).toBe(true);
      expect(isValidPosition(world, { x: 19, y: 9 })).toBe(true);
      expect(isValidPosition(world, { x: 30, y: 30 })).toBe(true);
      expect(isValidPosition(world, { x: 31, y: 0 })).toBe(false);
      expect(isValidPosition(world, { x: 0, y: 31 })).toBe(false);
      expect(isValidPosition(world, { x: -31, y: 0 })).toBe(false);
    });
  });

  describe('Grid Object Management', () => {
    it('should check if position is occupied', () => {
      expect(isPositionOccupied(world, { x: 0, y: 0 })).toBe(false);

      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      placeObjectInGrid(world.grid, object, { x: 5, y: 3 }, world.horizontalLimit);
      expect(isPositionOccupied(world, { x: 5, y: 3 })).toBe(true);
      expect(isPositionOccupied(world, { x: 6, y: 3 })).toBe(false);
    });

    it('should get object at position', () => {
      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      placeObjectInGrid(world.grid, object, { x: 5, y: 3 }, world.horizontalLimit);

      expect(getObjectAtPosition(world, { x: 5, y: 3 })).toBe(object);
      expect(getObjectAtPosition(world, { x: 6, y: 3 })).toBeNull();
    });

    it('should remove objects from grid', () => {
      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      placeObjectInGrid(world.grid, object, { x: 5, y: 3 }, world.horizontalLimit);
      expect(isPositionOccupied(world, { x: 5, y: 3 })).toBe(true);

      removeObjectFromGrid(world.grid, { x: 5, y: 3 }, world.horizontalLimit);
      expect(isPositionOccupied(world, { x: 5, y: 3 })).toBe(false);
    });

    it('should handle invalid positions safely', () => {
      const object: GameObject = {
        id: 'bot-1',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      placeObjectInGrid(world.grid, object, { x: -1, y: 0 }, world.horizontalLimit);
      removeObjectFromGrid(world.grid, { x: -1, y: 0 }, world.horizontalLimit);

      // Should not throw errors
      expect(isPositionOccupied(world, { x: -1, y: 0 })).toBe(false);
    });
  });
});
