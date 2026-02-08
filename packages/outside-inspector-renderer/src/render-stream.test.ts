import { describe, expect, it } from 'vitest';
import {
  RENDER_COMPONENTS,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  query,
  spawnBot,
  spawnFloorTile,
  Position,
} from '@outside/simulator';
import { applyInspectorStream, createInspectorRenderWorld } from './render-stream';

describe('inspector render stream', () => {
  it('applies snapshot then delta packets', () => {
    const sim = createWorld({ seed: 7, ticDurationMs: 50 });
    spawnFloorTile(sim, 0, 0, true);
    spawnBot(sim, { x: 1, y: 1, urge: 'none', tilesPerSec: 0 });

    const snapshot = createSnapshotSerializer(sim, [...RENDER_COMPONENTS]);
    const observer = createRenderObserverSerializer(sim);

    const inspector = createInspectorRenderWorld();
    applyInspectorStream(inspector, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    expect(query(inspector.world, [Position]).length).toBeGreaterThan(0);

    applyInspectorStream(inspector, { kind: 'delta', buffer: observer(), tic: 1 });
    expect(inspector.lastTic).toBe(1);
  });
});
