import { describe, it, expect } from 'vitest';
import {
  createWorld,
  spawnBot,
  runTics,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  RENDER_SNAPSHOT_COMPONENTS,
  Position,
} from '@outside/simulator';
import { applyRenderStream, createRenderWorld } from './render-world';
import { getFacingDirection, getIsMoving, getWalkFrame, runAnimationTic } from './animation';

describe('render animation system', () => {
  it('updates facing and walk frame based on position delta', () => {
    const simWorld = createWorld({ seed: 1, ticDurationMs: 50 });
    const eid = spawnBot(simWorld, { x: 0, y: 0, directionRad: 0, tilesPerSec: 1, urge: 'none' });
    const observer = createRenderObserverSerializer(simWorld);
    const snapshotSerializer = createSnapshotSerializer(simWorld, RENDER_SNAPSHOT_COMPONENTS);

    const renderWorld = createRenderWorld();
    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshotSerializer(), tic: 0 });
    runAnimationTic(renderWorld);

    runTics(simWorld, 1);
    const delta = observer();
    applyRenderStream(renderWorld, { kind: 'delta', buffer: delta, tic: 1 });
    runAnimationTic(renderWorld);

    expect(Position.x[eid]).not.toBe(0);
    expect(getFacingDirection(renderWorld, eid)).toBe('right');
    expect(getIsMoving(renderWorld, eid)).toBe(true);
    expect(getWalkFrame(renderWorld, eid)).toBeGreaterThanOrEqual(0);
  });
});
