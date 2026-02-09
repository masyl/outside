import { describe, expect, it } from 'vitest';
import { addComponent } from 'bitecs';
import {
  Collided,
  Follow,
  FollowTarget,
  RENDER_SNAPSHOT_COMPONENTS,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  removeEntity,
  query,
  spawnBot,
  spawnFood,
  spawnFloorTile,
  Position,
} from '@outside/simulator';
import { applyInspectorStream, createInspectorRenderWorld } from './render-stream';

describe('inspector render stream', () => {
  it('applies snapshot then delta packets', () => {
    const sim = createWorld({ seed: 7, ticDurationMs: 50 });
    spawnFloorTile(sim, 0, 0, true);
    const leader = spawnBot(sim, { x: 1, y: 1, urge: 'none', tilesPerSec: 0 });
    const follower = spawnBot(sim, {
      x: 2,
      y: 1,
      urge: 'none',
      tilesPerSec: 0,
    });
    addComponent(sim, follower, Follow);
    addComponent(sim, follower, FollowTarget);
    FollowTarget.eid[follower] = leader;
    addComponent(sim, follower, Collided);
    Collided.ticksRemaining[follower] = 2;

    const snapshot = createSnapshotSerializer(sim, [...RENDER_SNAPSHOT_COMPONENTS]);
    const observer = createRenderObserverSerializer(sim);

    const inspector = createInspectorRenderWorld();
    applyInspectorStream(inspector, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    expect(query(inspector.world, [Position]).length).toBeGreaterThan(0);
    expect(query(inspector.world, [Follow]).length).toBeGreaterThan(0);
    expect(query(inspector.world, [FollowTarget]).length).toBeGreaterThan(0);
    expect(query(inspector.world, [Collided]).length).toBeGreaterThan(0);

    applyInspectorStream(inspector, { kind: 'delta', buffer: observer(), tic: 1 });
    expect(inspector.lastTic).toBe(1);
  });

  it('treats snapshot as full replacement state', () => {
    const sim = createWorld({ seed: 13, ticDurationMs: 50 });
    const food = spawnFood(sim, { x: 0, y: 0 });
    const snapshot = createSnapshotSerializer(sim, [...RENDER_SNAPSHOT_COMPONENTS]);

    const inspector = createInspectorRenderWorld();
    applyInspectorStream(inspector, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    expect(query(inspector.world, [Position]).length).toBe(1);

    removeEntity(sim, food);
    applyInspectorStream(inspector, { kind: 'snapshot', buffer: snapshot(), tic: 1 });
    expect(query(inspector.world, [Position]).length).toBe(0);
  });
});
