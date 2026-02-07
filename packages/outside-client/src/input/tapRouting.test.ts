import { addTerrainObject, createWorldState, type TerrainObject } from '@outside/core';
import { describe, expect, it } from 'vitest';

import { routeTileTapToCommands } from './tapRouting';

describe('tapRouting', () => {
  it('toggles a tapped bot from wander → wait', () => {
    const world = createWorldState(42);
    world.objects.set('b1', {
      id: 'b1',
      type: 'bot',
      position: { x: 1.2, y: 1.8 },
      urge: { urge: 'wander' },
    });

    const routed = routeTileTapToCommands({ world, tile: { x: 1, y: 1 }, step: 10 });

    expect(routed.commands).toEqual([{ type: 'wait', id: 'b1' }]);
  });

  it('toggles a tapped bot from follow → wander', () => {
    const world = createWorldState(42);
    world.objects.set('b1', {
      id: 'b1',
      type: 'bot',
      position: { x: 2.0, y: 2.0 },
      urge: { urge: 'follow', followTargetId: 'leader', tightness: 0.5 },
    });

    const routed = routeTileTapToCommands({ world, tile: { x: 2, y: 2 }, step: 10 });

    expect(routed.commands).toEqual([{ type: 'wander', id: 'b1' }]);
  });

  it('spawns a bot on walkable terrain and follows nearest bot', () => {
    const world = createWorldState(42);

    const grass: TerrainObject = {
      id: 't1',
      type: 'grass',
      position: { x: 5, y: 5 },
      width: 1,
      height: 1,
      createdAt: 0,
    };
    addTerrainObject(world.groundLayer, grass);

    world.objects.set('near', {
      id: 'near',
      type: 'bot',
      position: { x: 6, y: 5 },
      urge: { urge: 'wander' },
    });
    world.objects.set('far', {
      id: 'far',
      type: 'bot',
      position: { x: 20, y: 20 },
      urge: { urge: 'wander' },
    });

    const routed = routeTileTapToCommands({ world, tile: { x: 5, y: 5 }, step: 123, tightness: 0.5 });

    expect(routed.commands[0].type).toBe('create');
    expect(routed.commands[1]).toEqual({ type: 'place', id: 'tap-bot-5-5-123', x: 5, y: 5 });
    expect(routed.commands[2]).toEqual({
      type: 'follow',
      id: 'tap-bot-5-5-123',
      targetId: 'near',
      tightness: 0.5,
    });
  });

  it('no-ops on non-walkable tiles', () => {
    const world = createWorldState(42);

    const water: TerrainObject = {
      id: 't1',
      type: 'water',
      position: { x: 5, y: 5 },
      width: 1,
      height: 1,
      createdAt: 0,
    };
    addTerrainObject(world.groundLayer, water);

    world.objects.set('near', {
      id: 'near',
      type: 'bot',
      position: { x: 6, y: 5 },
      urge: { urge: 'wander' },
    });

    const routed = routeTileTapToCommands({ world, tile: { x: 5, y: 5 }, step: 123 });
    expect(routed.commands).toEqual([]);
    expect(routed.resolved).toEqual({ kind: 'noop', reason: 'not-tappable' });
  });

  it('is deterministic for identical world + input', () => {
    const world = createWorldState(42);
    world.objects.set('b1', { id: 'b1', type: 'bot', position: { x: 1, y: 1 }, urge: { urge: 'wander' } });

    const a = routeTileTapToCommands({ world, tile: { x: 1, y: 1 }, step: 1 });
    const b = routeTileTapToCommands({ world, tile: { x: 1, y: 1 }, step: 1 });

    expect(a).toEqual(b);
  });
});

