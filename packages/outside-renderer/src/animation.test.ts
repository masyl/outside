import { describe, it, expect } from 'vitest';
import { addComponent, addEntity } from 'bitecs';
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
    const snapshotSerializer = createSnapshotSerializer(simWorld, [...RENDER_SNAPSHOT_COMPONENTS]);

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

  it('keeps walk frame cadence stable when tic throughput increases', () => {
    function runScenario(steps: number, stepMs: number): number {
      const renderWorld = createRenderWorld();
      const eid = addEntity(renderWorld.world);
      addComponent(renderWorld.world, eid, Position);
      Position.x[eid] = 0;
      Position.y[eid] = 0;

      runAnimationTic(renderWorld, 0);

      for (let i = 1; i <= steps; i++) {
        Position.x[eid] += 0.05;
        runAnimationTic(renderWorld, i * stepMs);
      }

      expect(getIsMoving(renderWorld, eid)).toBe(true);
      return getWalkFrame(renderWorld, eid);
    }

    const frameAt20Hz = runScenario(20, 50);
    const frameAt40Hz = runScenario(40, 25);

    expect(frameAt40Hz).toBe(frameAt20Hz);
  });

  it('does not instantly reset walk frame on short idle jitter', () => {
    const renderWorld = createRenderWorld();
    const eid = addEntity(renderWorld.world);
    addComponent(renderWorld.world, eid, Position);
    Position.x[eid] = 0;
    Position.y[eid] = 0;

    runAnimationTic(renderWorld, 0);

    // Move long enough to leave walk frame 0.
    for (let i = 1; i <= 10; i++) {
      Position.x[eid] += 0.05;
      runAnimationTic(renderWorld, i * 50);
    }
    const movingFrame = getWalkFrame(renderWorld, eid);
    expect(movingFrame).toBeGreaterThan(0);
    expect(getIsMoving(renderWorld, eid)).toBe(true);

    // Short idle gap should keep current moving frame (debounced reset).
    runAnimationTic(renderWorld, 530);
    expect(getIsMoving(renderWorld, eid)).toBe(true);
    expect(getWalkFrame(renderWorld, eid)).toBe(movingFrame);

    // After enough idle time, it should settle to idle frame.
    runAnimationTic(renderWorld, 760);
    expect(getIsMoving(renderWorld, eid)).toBe(false);
    expect(getWalkFrame(renderWorld, eid)).toBe(0);
  });
});
