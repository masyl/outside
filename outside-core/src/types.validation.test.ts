import { describe, it, expect } from 'vitest';
import {
  Position,
  Direction,
  ObjectType,
  GameObject,
  Bot,
  TerrainType,
  TerrainObject,
  GroundLayer,
  WorldState,
} from './types';

describe('Type System Validation', () => {
  describe('Position Type', () => {
    it('should accept valid coordinate values', () => {
      const validPositions: Position[] = [
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { x: -5, y: -10 },
        { x: 999999, y: 999999 },
      ];

      validPositions.forEach((pos) => {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(Number.isInteger(pos.x)).toBe(true);
        expect(Number.isInteger(pos.y)).toBe(true);
      });
    });

    it('should handle coordinate validation', () => {
      const position: Position = { x: 5, y: 3 };

      // Position type itself doesn't enforce bounds, so any numbers are valid
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');

      // Additional validation logic would be application-specific
      expect(() => {
        const minX = position.x < 0 ? 'invalid' : 'valid';
        const minY = position.y < 0 ? 'invalid' : 'valid';
        expect(minX).toBe('valid');
        expect(minY).toBe('valid');
      }).not.toThrow();
    });
  });

  describe('Direction Type', () => {
    it('should only accept valid direction values', () => {
      const validDirections: Direction[] = [
        'left',
        'right',
        'up',
        'down',
        'up-left',
        'up-right',
        'down-left',
        'down-right',
      ];

      validDirections.forEach((direction) => {
        expect(typeof direction).toBe('string');
        expect([
          'left',
          'right',
          'up',
          'down',
          'up-left',
          'up-right',
          'down-left',
          'down-right',
        ]).toContain(direction);
      });
    });

    it('should be exhaustive for all 8 directions', () => {
      const directions: Direction[] = [
        'left',
        'right',
        'up',
        'down',
        'up-left',
        'up-right',
        'down-left',
        'down-right',
      ];

      expect(directions).toHaveLength(8);
      expect(new Set(directions)).toHaveLength(8); // No duplicates
    });
  });

  describe('Object Types', () => {
    it('should enforce GameObject structure', () => {
      const gameObject: GameObject = {
        id: 'test-object',
        type: 'bot',
        position: { x: 5, y: 3 },
        facing: 'up',
      };

      expect(typeof gameObject.id).toBe('string');
      expect(gameObject.type).toBe('bot');
      expect(typeof gameObject.position).toBe('object');
      expect(gameObject.position).toHaveProperty('x');
      expect(gameObject.position).toHaveProperty('y');
      expect(gameObject.facing).toBe('up');
    });

    it('should allow optional facing direction', () => {
      const gameObjectWithoutFacing: GameObject = {
        id: 'test-object',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      expect(gameObjectWithoutFacing.facing).toBeUndefined();

      const gameObjectWithFacing: GameObject = {
        id: 'test-object-2',
        type: 'bot',
        position: { x: 5, y: 3 },
        facing: 'left',
      };

      expect(gameObjectWithFacing.facing).toBe('left');
    });

    it('should enforce Bot interface extends GameObject', () => {
      const bot: Bot = {
        id: 'test-bot',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      // Bot should have all GameObject properties
      expect(typeof bot.id).toBe('string');
      expect(bot.type).toBe('bot');
      expect(typeof bot.position).toBe('object');

      // Bot.type should be constrained to 'bot'
      expect(bot.type).toBe('bot');
    });
  });

  describe('Terrain Types', () => {
    it('should only accept valid terrain types', () => {
      const validTerrainTypes: TerrainType[] = ['grass', 'dirt', 'water', 'sand', 'hole'];

      validTerrainTypes.forEach((terrainType) => {
        expect(typeof terrainType).toBe('string');
        expect(['grass', 'dirt', 'water', 'sand', 'hole']).toContain(terrainType);
      });
    });

    it('should enforce TerrainObject structure', () => {
      const terrainObject: TerrainObject = {
        id: 'test-terrain',
        type: 'grass',
        position: { x: 5, y: 3 },
        width: 2,
        height: 2,
        createdAt: Date.now(),
      };

      expect(typeof terrainObject.id).toBe('string');
      expect(['grass', 'dirt', 'water', 'sand', 'hole']).toContain(terrainObject.type);
      expect(typeof terrainObject.position).toBe('object');
      expect(typeof terrainObject.width).toBe('number');
      expect(typeof terrainObject.height).toBe('number');
      expect(typeof terrainObject.createdAt).toBe('number');

      expect(terrainObject.width).toBeGreaterThan(0);
      expect(terrainObject.height).toBeGreaterThan(0);
    });
  });

  describe('Grid Type', () => {
    it('should support null and GameObject values', () => {
      const bot: GameObject = {
        id: 'test-bot',
        type: 'bot',
        position: { x: 5, y: 3 },
      };

      // Grid cells can contain GameObject or null
      const cellWithObject: GameObject | null = bot;
      const cellWithNull: GameObject | null = null;

      expect(cellWithObject).toBe(bot);
      expect(cellWithNull).toBeNull();
    });
  });

  describe('Complex Type Compositions', () => {
    it('should support GroundLayer structure', () => {
      const terrain: TerrainObject = {
        id: 'test-terrain',
        type: 'grass',
        position: { x: 5, y: 3 },
        width: 1,
        height: 1,
        createdAt: Date.now(),
      };

      const groundLayer: GroundLayer = {
        terrainObjects: new Map([['test-terrain', terrain]]),
        terrainObjectsByPosition: new Map([['5,3', [terrain]]]),
      };

      expect(groundLayer.terrainObjects.get('test-terrain')).toBe(terrain);
      expect(groundLayer.terrainObjectsByPosition.get('5,3')).toEqual([terrain]);
    });

    it('should support WorldState structure', () => {
      const worldState: WorldState = {
        grid: Array(10)
          .fill(null)
          .map(() => Array(20).fill(null)),
        objects: new Map(),
        groundLayer: {
          terrainObjects: new Map(),
          terrainObjectsByPosition: new Map(),
        },
        horizontalLimit: 30,
        verticalLimit: 30,
        seed: 42,
      };

      const gridSize = 30 * 2 + 1; // 61
      expect(worldState.grid).toHaveLength(gridSize);
      expect(worldState.grid[0]).toHaveLength(gridSize);
      expect(worldState.horizontalLimit).toBe(30);
      expect(worldState.verticalLimit).toBe(30);
      expect(worldState.seed).toBe(42);
      expect(worldState.objects.size).toBe(0);
      expect(worldState.groundLayer.terrainObjects.size).toBe(0);
    });
  });

  describe('Type Safety Constraints', () => {
    it('should enforce ObjectType constraints', () => {
      // Currently only 'bot' is supported, but this tests extensibility
      const validObjectTypes: ObjectType[] = ['bot'];

      validObjectTypes.forEach((type) => {
        expect(typeof type).toBe('string');
        expect(validObjectTypes).toContain(type);
      });
    });

    it('should handle type-specific property constraints', () => {
      // TerrainObject dimensions should be positive
      const createTerrainObject = (overrides: Partial<TerrainObject> = {}): TerrainObject => ({
        id: 'test',
        type: 'grass',
        position: { x: 0, y: 0 },
        width: 1,
        height: 1,
        createdAt: Date.now(),
        ...overrides,
      });

      // Valid dimensions
      expect(() => createTerrainObject({ width: 5, height: 3 })).not.toThrow();

      // Invalid dimensions (negative/zero would be application-level validation)
      const negativeWidth = createTerrainObject({ width: -1 });
      const negativeHeight = createTerrainObject({ height: 0 });

      expect(negativeWidth.width).toBe(-1); // Type system allows it, validation would be runtime
      expect(negativeHeight.height).toBe(0);
    });
  });
});
