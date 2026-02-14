import { describe, it, expect } from 'vitest';
import {
  createWorld,
  removeEntity,
  spawnBot,
  spawnFood,
  spawnHero,
  spawnFloorTile,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  RENDER_SNAPSHOT_COMPONENTS,
  Position,
  DefaultSpriteKey,
  setPointerWorld,
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
    const snapshotSerializer = createSnapshotSerializer(simWorld, [...RENDER_SNAPSHOT_COMPONENTS]);

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

  it('treats snapshot as full replacement state', () => {
    const simWorld = createWorld({ seed: 11, ticDurationMs: 50 });
    const foodEid = spawnFood(simWorld, { x: 0, y: 0 });
    const snapshotSerializer = createSnapshotSerializer(simWorld, [...RENDER_SNAPSHOT_COMPONENTS]);

    const renderWorld = createRenderWorld();
    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshotSerializer(), tic: 0 });
    expect(query(renderWorld.world, [Position]).length).toBeGreaterThan(0);

    removeEntity(simWorld, foodEid);
    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshotSerializer(), tic: 1 });
    expect(query(renderWorld.world, [Position]).length).toBe(0);
  });

  it('streams pointer entity when pointer world position is set', () => {
    const simWorld = createWorld({ seed: 17, ticDurationMs: 50 });
    setPointerWorld(simWorld, 3.25, -2.5);
    const snapshotSerializer = createSnapshotSerializer(simWorld, [...RENDER_SNAPSHOT_COMPONENTS]);
    const renderWorld = createRenderWorld();

    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshotSerializer(), tic: 0 });
    const pointerEid = query(renderWorld.world, [Position]).find(
      (eid) => DefaultSpriteKey.value[eid] === 'ui.cursor.r0c0'
    );

    expect(pointerEid).toBeDefined();
    expect(pointerEid).not.toBeUndefined();
    if (pointerEid != null) {
      expect(Position.x[pointerEid]).toBe(3.25);
      expect(Position.y[pointerEid]).toBe(-2.5);
    }
  });
});
