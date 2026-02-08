import { describe, it, expect } from 'vitest';
import {
  createWorld,
  spawnBot,
  spawnFood,
  spawnHero,
  spawnFloorTile,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  RENDER_COMPONENTS,
  Position,
  DefaultSpriteKey,
} from '@outside/simulator';
import { applyRenderStream, createRenderWorld } from './render-world';
import { query } from 'bitecs';

describe('render stream sync', () => {
  it('applies snapshot and delta streams into render world', () => {
    const simWorld = createWorld({ seed: 7, ticDurationMs: 50 });
    spawnFloorTile(simWorld, 0, 0, true);
    spawnBot(simWorld, { x: 1, y: 1 });
    spawnHero(simWorld, { x: -1, y: 0 });
    spawnFood(simWorld, { x: 0.5, y: -0.5 });

    const observer = createRenderObserverSerializer(simWorld);
    const snapshotSerializer = createSnapshotSerializer(simWorld, RENDER_COMPONENTS);

    const renderWorld = createRenderWorld();
    const snapshot = snapshotSerializer();
    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshot, tic: 0 });

    const renderEntities = query(renderWorld.world, [Position]);
    expect(renderEntities.length).toBeGreaterThan(0);
    const botLike = renderEntities.find(
      (eid) => DefaultSpriteKey.value[eid] === 'actor.bot' || DefaultSpriteKey.value[eid] === 'actor.hero'
    );
    expect(botLike).toBeDefined();

    const delta = observer();
    applyRenderStream(renderWorld, { kind: 'delta', buffer: delta, tic: 1 });
    const afterDelta = query(renderWorld.world, [Position]);
    expect(afterDelta.length).toBeGreaterThan(0);
  });
});
