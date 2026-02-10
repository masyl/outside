import { describe, expect, it } from 'vitest';
import {
  FloorTile,
  RENDER_SNAPSHOT_COMPONENTS,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  getPathfindingDebugPaths,
  getViewportFollowTarget,
  orderEntityToTile,
  Position,
  query,
  runTics,
  Walkable,
} from '@outside/simulator';
import {
  applyInspectorStream,
  buildInspectorFrame,
  createInspectorRenderWorld,
} from '@outside/inspector-renderer';
import { spawnDungeonWithFoodAndHero } from '../simulator/spawnCloud';

describe('bot and hero path overlay', () => {
  it('uses simulator-provided path debug and keeps inspector frame logic-free', () => {
    const sim = createWorld({ seed: 4, ticDurationMs: 1000 / 30 });
    spawnDungeonWithFoodAndHero(sim, 4, 10, {
      botCount: 10,
      dogCount: 10,
      catCount: 10,
      foodCount: 10,
    });

    const heroEid = getViewportFollowTarget(sim);
    expect(heroEid).toBeGreaterThan(0);
    const heroPos = { x: Position.x[heroEid], y: Position.y[heroEid] };
    const floorWalkable = query(sim, [Position, FloorTile, Walkable]);
    const target = floorWalkable
      .map((eid) => ({
        x: Math.floor(Position.x[eid]),
        y: Math.floor(Position.y[eid]),
        d: Math.hypot(Position.x[eid] - heroPos.x, Position.y[eid] - heroPos.y),
      }))
      .filter((cell) => cell.d >= 10)
      .sort((a, b) => b.d - a.d)[0];
    expect(target).toBeDefined();
    orderEntityToTile(sim, heroEid, target!.x, target!.y);

    // Let wanderers pick targets and produce stable path state before serializing.
    runTics(sim, 5);

    const debugPaths = getPathfindingDebugPaths(sim, { focusedEid: heroEid });
    expect(debugPaths.some((path) => path.style === 'ordered')).toBe(true);
    expect(debugPaths.some((path) => path.style === 'wander')).toBe(true);

    const snapshot = createSnapshotSerializer(sim, [...RENDER_SNAPSHOT_COMPONENTS]);
    const observer = createRenderObserverSerializer(sim);
    const inspector = createInspectorRenderWorld();
    applyInspectorStream(inspector, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    applyInspectorStream(inspector, { kind: 'delta', buffer: observer(), tic: 1 });

    const baseFrame = buildInspectorFrame(inspector.world);
    expect(baseFrame.pathfindingPaths).toEqual([]);
    expect(baseFrame.pathfindingPathCount).toBe(0);

    const mergedFrame = {
      ...baseFrame,
      pathfindingPaths: debugPaths,
    };

    expect(mergedFrame.pathfindingPaths.some((path) => path.style === 'ordered')).toBe(true);
    expect(mergedFrame.pathfindingPaths.some((path) => path.style === 'wander')).toBe(true);
    expect(mergedFrame.pathfindingPaths.some((path) => path.eid === heroEid)).toBe(true);
    expect(heroPos.x).not.toBeNaN();
  });
});
