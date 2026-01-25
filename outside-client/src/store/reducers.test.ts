import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enableMapSet } from 'immer';
import { reducer } from './reducers';
import { createWorldState } from '@outside/core';
import { Action } from './actions';
import { initBotMotion } from './botMotion';

// Enable Immer MapSet plugin
enableMapSet();

describe('Reducer Logic', () => {
  let initialState: ReturnType<typeof createWorldState>;

  beforeEach(() => {
    initialState = createWorldState(42);
  });

  describe('CREATE_BOT Action', () => {
    it('should create new bot with valid payload', () => {
      const action: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };

      const newState = reducer(initialState, action);

      expect(newState.objects.has('bot-1')).toBe(true);
      const bot = newState.objects.get('bot-1');
      expect(bot).toEqual({
        id: 'bot-1',
        type: 'bot',
        // Bots are created without a position and are invisible until placed
      });
    });

    it('should ignore duplicate bot creation', () => {
      // First add a bot
      const createAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      const stateWithBot = reducer(initialState, createAction);

      // Try to create duplicate
      const duplicateAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      const unchangedState = reducer(stateWithBot, duplicateAction);

      expect(unchangedState).toEqual(stateWithBot);
      expect(unchangedState.objects.size).toBe(1);
    });

    it('should create bot without position (invisible until placed)', () => {
      const action: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'test-bot' },
      };

      const newState = reducer(initialState, action);
      const bot = newState.objects.get('test-bot');

      // Bots are created without a position and are invisible until placed
      expect(bot?.position).toBeUndefined();
      expect(bot?.id).toBe('test-bot');
      expect(bot?.type).toBe('bot');
    });
  });

  describe('MOVE_BOT Action', () => {
    beforeEach(() => {
      // Create terrain first
      const createTerrainAction: Action = {
        type: 'CREATE_TERRAIN',
        payload: {
          id: 'ground',
          terrainType: 'grass',
          x: 0,
          y: 0,
          width: 20,
          height: 10,
        },
      };
      initialState = reducer(initialState, createTerrainAction);

      // Add a bot to move
      const createBotAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      // Update initialState with the created bot
      initialState = reducer(initialState, createBotAction);
    });

    it('should move bot to valid position', () => {
      // First place bot at position (0,0)
      const placeAction: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-1', position: { x: 0, y: 0 } },
      };
      const stateWithPlacedBot = reducer(initialState, placeAction);

      // Move bot to new position
      const moveAction: Action = {
        type: 'MOVE_OBJECT',
        payload: { id: 'bot-1', direction: 'right', distance: 2 },
      };
      const newState = reducer(stateWithPlacedBot, moveAction);

      // Bot should be at new position
      const bot = newState.objects.get('bot-1');
      expect(bot?.position).toEqual({ x: 2, y: 0 });
    });

    it('should handle move of non-existent bot', () => {
      const action: Action = {
        type: 'MOVE_OBJECT',
        payload: { id: 'non-existent-bot', direction: 'right', distance: 1 },
      };

      const newState = reducer(initialState, action);

      // State should be unchanged
      expect(newState).toEqual(initialState);
    });

    it('should validate move direction and distance', () => {
      const placeAction: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-1', position: { x: 5, y: 3 } },
      };
      const stateWithBot = reducer(initialState, placeAction);

      // Test valid move
      const validAction: Action = {
        type: 'MOVE_OBJECT',
        payload: { id: 'bot-1', direction: 'up', distance: 1 },
      };
      const validState = reducer(stateWithBot, validAction);
      const movedBot = validState.objects.get('bot-1');
      expect(movedBot?.position).toEqual({ x: 5, y: 2 });

      // Test different directions
      const directions = [
        { dir: 'left', expected: { x: 4, y: 3 } },
        { dir: 'down', expected: { x: 5, y: 4 } },
        { dir: 'up-left', expected: { x: 4, y: 2 } },
        { dir: 'up-right', expected: { x: 6, y: 2 } },
        { dir: 'down-left', expected: { x: 4, y: 4 } },
        { dir: 'down-right', expected: { x: 6, y: 4 } },
      ];

      directions.forEach(({ dir, expected }) => {
        const action: Action = {
          type: 'MOVE_OBJECT',
          payload: { id: 'bot-1', direction: dir as any, distance: 1 },
        };
        const resultState = reducer(stateWithBot, action);
        const bot = resultState.objects.get('bot-1');
        expect(bot?.position).toEqual(expected);
      });
    });

    it('should handle zero distance move', () => {
      const placeAction: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-1', position: { x: 5, y: 3 } },
      };
      const stateWithBot = reducer(initialState, placeAction);

      const action: Action = {
        type: 'MOVE_OBJECT',
        payload: { id: 'bot-1', direction: 'right', distance: 0 },
      };
      const newState = reducer(stateWithBot, action);

      // Position should be unchanged
      const bot = newState.objects.get('bot-1');
      expect(bot?.position).toEqual({ x: 5, y: 3 });
    });
  });

  describe('SIM_TICK Action', () => {
    beforeEach(() => {
      // Create terrain first (walkable region)
      initialState = reducer(initialState, {
        type: 'CREATE_TERRAIN',
        payload: {
          id: 'ground',
          terrainType: 'grass',
          x: -5,
          y: -5,
          width: 20,
          height: 20,
        },
      });

      // Create and place a bot
      initialState = reducer(initialState, { type: 'CREATE_BOT', payload: { id: 'bot-sim' } });
      initialState = reducer(initialState, {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-sim', position: { x: 0, y: 0 } },
      });
    });

    it('advances timeMs and updates bot position continuously', () => {
      const before = initialState.objects.get('bot-sim')!;
      expect(before.position).toEqual({ x: 0, y: 0 });
      expect(initialState.timeMs).toBe(0);

      const next = reducer(initialState, { type: 'SIM_TICK', payload: { dtMs: 50 } });
      expect(next.timeMs).toBe(50);

      const bot = next.objects.get('bot-sim')!;
      expect(bot.position).toBeDefined();
      expect(bot.velocity).toBeDefined();
      expect(bot.motion).toBeDefined();
      expect(bot.position).not.toEqual({ x: 0, y: 0 });
    });

    it('is deterministic for the same starting state and ticks', () => {
      const run = (s: typeof initialState) => {
        let cur = s;
        for (let i = 0; i < 10; i++) {
          cur = reducer(cur, { type: 'SIM_TICK', payload: { dtMs: 50 } });
        }
        return cur;
      };

      const a = run(initialState);
      const b = run(initialState);
      expect(a).toEqual(b);
    });

    it('bounces off non-walkable terrain by reflecting velocity', () => {
      const seed = 42;

      // Find a bot id whose initial heading points mostly to the right.
      let botId = '';
      for (let i = 0; i < 2000; i++) {
        const candidate = `bot-right-${i}`;
        const v = initBotMotion({ seed, botId: candidate }).velocity;
        if (v.x > 0.9 && Math.abs(v.y) < 0.2) {
          botId = candidate;
          break;
        }
      }
      expect(botId).not.toBe('');

      let s = createWorldState(seed);
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2);
      try {
        // Walkable grass region
        s = reducer(s, {
          type: 'CREATE_TERRAIN',
          payload: { id: 'grass', terrainType: 'grass', x: -5, y: -5, width: 20, height: 20 },
        });
        // Non-walkable hole at tile (1,0) (created after grass)
        s = reducer(s, {
          type: 'CREATE_TERRAIN',
          payload: { id: 'hole', terrainType: 'hole', x: 1, y: 0, width: 1, height: 1 },
        });
      } finally {
        nowSpy.mockRestore();
      }
      s = reducer(s, { type: 'CREATE_BOT', payload: { id: botId } });
      s = reducer(s, { type: 'PLACE_OBJECT', payload: { id: botId, position: { x: 0.9, y: 0.1 } } });

      const next = reducer(s, { type: 'SIM_TICK', payload: { dtMs: 200 } });
      const bot = next.objects.get(botId)!;

      // We attempted to move into tile (1,0) which is a hole → expect x velocity reflected.
      expect(bot.velocity).toBeDefined();
      expect(bot.velocity!.x).toBeLessThan(0);
      // Position should not have crossed into the hole tile.
      expect(bot.position!.x).toBeLessThan(1);
    });
  });

  describe('PLACE_TERRAIN Action', () => {
    it('should add terrain to ground layer', () => {
      const action: Action = {
        type: 'CREATE_TERRAIN',
        payload: {
          id: 'terrain-1',
          terrainType: 'grass',
          x: 5,
          y: 3,
          width: 2,
          height: 2,
        },
      };

      const newState = reducer(initialState, action);

      expect(newState.groundLayer.terrainObjects.has('terrain-1')).toBe(true);
      const terrain = newState.groundLayer.terrainObjects.get('terrain-1');
      expect(terrain).toEqual({
        id: 'terrain-1',
        type: 'grass',
        position: { x: 5, y: 3 },
        width: 2,
        height: 2,
        createdAt: expect.any(Number),
      });
    });

    it('should handle terrain placement validation', () => {
      const validAction: Action = {
        type: 'CREATE_TERRAIN',
        payload: {
          id: 'terrain-1',
          terrainType: 'grass',
          x: 5,
          y: 3,
          width: 2,
          height: 2,
        },
      };

      // Test valid terrain types
      const terrainTypes: Array<any> = ['grass', 'dirt', 'water', 'sand', 'hole'];
      terrainTypes.forEach((terrainType) => {
        const action = { ...validAction, payload: { ...validAction.payload, terrainType } };
        const state = reducer(initialState, action);
        expect(state.groundLayer.terrainObjects.has('terrain-1')).toBe(true);
      });
    });

    it('should handle invalid terrain placement', () => {
      const action: Action = {
        type: 'CREATE_TERRAIN',
        payload: {
          id: 'terrain-1',
          terrainType: 'invalid' as any,
          x: 5,
          y: 3,
          width: 2,
          height: 2,
        },
      };

      // This should not crash the reducer
      const newState = reducer(initialState, action);
      expect(newState).toBeDefined();
    });
  });

  describe('PLACE_OBJECT Action', () => {
    beforeEach(() => {
      // Create terrain first
      const createTerrainAction: Action = {
        type: 'CREATE_TERRAIN',
        payload: {
          id: 'ground',
          terrainType: 'grass',
          x: 0,
          y: 0,
          width: 20,
          height: 10,
        },
      };
      initialState = reducer(initialState, createTerrainAction);

      // Add a bot to place
      const createBotAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      // Update initialState with the created bot
      initialState = reducer(initialState, createBotAction);
    });

    it('should place object at valid position', () => {
      const action: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-1', position: { x: 10, y: 5 } },
      };

      const newState = reducer(initialState, action);

      // Convert world coordinates (10, 5) to grid indices
      const gridX = 10 + 30; // world.horizontalLimit (default 30)
      const gridY = 5 + 30; // world.verticalLimit (default 30)
      expect(newState.grid[gridY][gridX]).not.toBeNull();
      const placedObject = newState.grid[gridY][gridX];
      expect(placedObject?.id).toBe('bot-1');
    });

    it('should handle placement of non-existent object', () => {
      const action: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'non-existent-bot', position: { x: 5, y: 3 } },
      };

      const newState = reducer(initialState, action);

      // Grid should remain unchanged
      expect(newState.grid).toEqual(initialState.grid);
    });

    it('should handle out-of-bounds placement', () => {
      const action: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-1', position: { x: 25, y: 15 } },
      };

      const newState = reducer(initialState, action);

      // Grid should remain unchanged for out-of-bounds positions
      expect(newState.grid).toEqual(initialState.grid);
    });
  });

  describe('SET_WORLD_STATE Action', () => {
    it('should replace entire world state', () => {
      const newWorldState = createWorldState(999);
      const action: Action = {
        type: 'SET_WORLD_STATE',
        payload: { worldState: newWorldState },
      };

      const newState = reducer(initialState, action);

      expect(newState).toBe(newWorldState);
      expect(newState.seed).toBe(999);
      expect(newState).not.toBe(initialState);
    });

    it('should handle empty world state replacement by keeping current state', () => {
      const action: Action = {
        type: 'SET_WORLD_STATE',
        payload: { worldState: null },
      };

      const newState = reducer(initialState, action);

      expect(newState).toBe(initialState);
    });
  });

  describe('Unknown Actions', () => {
    it('should return unchanged state for unknown action types', () => {
      const unknownAction = {
        type: 'UNKNOWN_ACTION',
        payload: {},
      } as any;

      const newState = reducer(initialState, unknownAction);

      expect(newState).toBe(initialState);
    });

    it('should handle malformed actions gracefully', () => {
      // Test various malformed actions
      const malformedActions = [
        { type: null, payload: {} } as any,
        { payload: {} } as any,
        {} as any,
        { type: '', payload: {} } as any,
      ];

      malformedActions.forEach((action) => {
        const newState = reducer(initialState, action);
        expect(newState).toEqual(initialState);
      });
    });
  });

  describe('State Immutability', () => {
    it('should not modify original state', () => {
      const action: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };

      const originalSeed = initialState.seed;
      const newState = reducer(initialState, action);

      // Original state should remain unchanged
      expect(initialState.seed).toBe(originalSeed);
      expect(initialState.objects.size).toBe(0);
      expect(newState.objects.size).toBe(1);
    });

    it('should create new state object', () => {
      const action: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };

      const newState = reducer(initialState, action);

      // New state should be different object
      expect(newState).not.toBe(initialState);
    });
  });

  describe('Branch Coverage', () => {
    it('should handle all conditional paths in CREATE_BOT', () => {
      // Test existing object path
      const createAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      const stateWithBot = reducer(initialState, createAction);

      // Test duplicate path (should not create new object)
      const duplicateAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      const unchangedState = reducer(stateWithBot, duplicateAction);

      expect(unchangedState.objects.size).toBe(1);
      expect(unchangedState).toEqual(stateWithBot);
    });

    it('should handle all conditional paths in MOVE_BOT', () => {
      // Test non-existent bot path
      const moveNonExistentAction: Action = {
        type: 'MOVE_OBJECT',
        payload: { id: 'ghost-bot', direction: 'right', distance: 1 },
      };
      const unchangedState1 = reducer(initialState, moveNonExistentAction);
      expect(unchangedState1).toEqual(initialState);

      // Setup state with terrain and bot
      let state = initialState;
      const createTerrainAction: Action = {
        type: 'CREATE_TERRAIN',
        payload: { id: 'ground', terrainType: 'grass', x: 0, y: 0, width: 20, height: 10 },
      };
      state = reducer(state, createTerrainAction);

      // Test zero distance path
      const createAction: Action = {
        type: 'CREATE_BOT',
        payload: { id: 'bot-1' },
      };
      const placeAction: Action = {
        type: 'PLACE_OBJECT',
        payload: { id: 'bot-1', position: { x: 5, y: 3 } },
      };
      const stateWithBot = reducer(state, createAction);
      const stateWithPlacedBot = reducer(stateWithBot, placeAction);

      const zeroDistanceAction: Action = {
        type: 'MOVE_OBJECT',
        payload: { id: 'bot-1', direction: 'right', distance: 0 },
      };
      const unchangedState2 = reducer(stateWithPlacedBot, zeroDistanceAction);
      expect(unchangedState2.grid[3][5]).toEqual(stateWithPlacedBot.grid[3][5]);
    });
  });
});
