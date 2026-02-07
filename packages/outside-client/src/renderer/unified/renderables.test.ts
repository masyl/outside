import { describe, expect, it } from 'vitest';
import type { WorldState } from '@outside/core';
import { addTerrainObject, createWorldState, placeObjectInGrid } from '@outside/core';

import { buildRenderables } from './renderables';

describe('buildRenderables', () => {
  it('returns terrain renderables (one per TerrainObject rectangle)', () => {
    const world = createWorldState(0) as WorldState;

    addTerrainObject(world.groundLayer, {
      id: 't-1',
      type: 'grass',
      position: { x: 0, y: 0 },
      width: 2,
      height: 1,
      createdAt: 10,
    });

    addTerrainObject(world.groundLayer, {
      id: 't-2',
      type: 'water',
      position: { x: 1, y: 1 },
      width: 1,
      height: 2,
      createdAt: 20,
    });

    const renderables = buildRenderables(world);

    const terrain = renderables.filter((r) => r.kind === 'terrain');
    expect(terrain).toHaveLength(2);

    expect(terrain[0]).toMatchObject({
      id: 't-1',
      kind: 'terrain',
      position: { x: 0, y: 0 },
      size: { width: 2, height: 1 },
      sprite: { textureKey: 'terrain:grass' },
      z: 10,
    });
    expect(terrain[1]).toMatchObject({
      id: 't-2',
      kind: 'terrain',
      position: { x: 1, y: 1 },
      size: { width: 1, height: 2 },
      sprite: { textureKey: 'terrain:water' },
      z: 20,
    });
  });

  it('returns bot renderables only for placed bots', () => {
    const world = createWorldState(0) as WorldState;

    // Bot without position (unplaced)
    world.objects.set('bot-unplaced', { id: 'bot-unplaced', type: 'bot' });

    // Bot with position (placed)
    world.objects.set('bot-placed', { id: 'bot-placed', type: 'bot', position: { x: 2, y: 3 } });
    placeObjectInGrid(world.grid, world.objects.get('bot-placed')!, { x: 2, y: 3 }, world.horizontalLimit);

    const renderables = buildRenderables(world);

    const bots = renderables.filter((r) => r.kind === 'bot');
    expect(bots).toHaveLength(1);
    expect(bots[0]).toMatchObject({
      id: 'bot-placed',
      kind: 'bot',
      position: { x: 2, y: 3 },
      sprite: { textureKey: 'bot' },
    });
  });

  it('keeps bots above terrain by z-order', () => {
    const world = createWorldState(0) as WorldState;

    addTerrainObject(world.groundLayer, {
      id: 't-epoch',
      type: 'grass',
      position: { x: 0, y: 0 },
      width: 1,
      height: 1,
      // Simulate a realistic Date.now()-style timestamp.
      createdAt: 2_000_000_000_000,
    });

    world.objects.set('bot-placed', { id: 'bot-placed', type: 'bot', position: { x: 1, y: 1 } });
    placeObjectInGrid(world.grid, world.objects.get('bot-placed')!, { x: 1, y: 1 }, world.horizontalLimit);

    const renderables = buildRenderables(world);
    const terrain = renderables.find((r) => r.kind === 'terrain')!;
    const bot = renderables.find((r) => r.kind === 'bot')!;

    expect(bot.z).toBeGreaterThan(terrain.z);
  });

  it('sorts by z then id for deterministic ordering', () => {
    const world = createWorldState(0) as WorldState;

    addTerrainObject(world.groundLayer, {
      id: 't-b',
      type: 'grass',
      position: { x: 0, y: 0 },
      width: 1,
      height: 1,
      createdAt: 10,
    });

    addTerrainObject(world.groundLayer, {
      id: 't-a',
      type: 'grass',
      position: { x: 0, y: 0 },
      width: 1,
      height: 1,
      createdAt: 10,
    });

    const renderables = buildRenderables(world);
    expect(renderables.map((r) => r.id)).toEqual(['t-a', 't-b']);
  });
});

