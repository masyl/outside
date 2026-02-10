import { describe, expect, it } from 'vitest';
import { hasComponent } from 'bitecs';
import {
  createWorld,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  debugJumpPulse,
  Grounded,
  Hero,
  Position,
  PositionZ,
  query,
  RENDER_SNAPSHOT_COMPONENTS,
  runTics,
  spawnFloorRect,
  spawnHero,
  VelocityZ,
} from '@outside/simulator';
import { applyRenderStream, createRenderWorld } from './render-world';

describe('jump stream roundtrip', () => {
  it('propagates hero vertical state to renderer world tic-by-tic', () => {
    const simWorld = createWorld({ seed: 5, ticDurationMs: 1000 / 30 });
    spawnFloorRect(simWorld, -4, -4, 4, 4, true);
    const heroEid = spawnHero(simWorld, { x: 0.5, y: 0.5 });

    const snapshot = createSnapshotSerializer(simWorld, RENDER_SNAPSHOT_COMPONENTS);
    const renderWorld = createRenderWorld();

    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    const renderHeroes = query(renderWorld.world, [Hero, Position]);
    const renderHeroEid = renderHeroes[0];
    expect(renderHeroEid).toBeTypeOf('number');
    runTics(simWorld, 2);
    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshot(), tic: 2 });

    expect(hasComponent(renderWorld.world, renderHeroEid, PositionZ)).toBe(true);
    expect(hasComponent(renderWorld.world, renderHeroEid, Grounded)).toBe(true);
    expect(hasComponent(renderWorld.world, renderHeroEid, VelocityZ)).toBe(true);

    const beforeZ = PositionZ.z[renderHeroEid];
    const beforeVz = VelocityZ.z[renderHeroEid];

    const applied = debugJumpPulse(simWorld, 0.8, heroEid);
    expect(applied).toBe(1);
    runTics(simWorld, 1);
    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshot(), tic: 3 });

    const hasZAfter = hasComponent(renderWorld.world, renderHeroEid, PositionZ);
    const hasVzAfter = hasComponent(renderWorld.world, renderHeroEid, VelocityZ);
    const hasGroundedAfter = hasComponent(renderWorld.world, renderHeroEid, Grounded);
    expect(hasZAfter).toBe(true);
    expect(hasVzAfter).toBe(true);
    expect(hasGroundedAfter).toBe(true);

    const afterZ = PositionZ.z[renderHeroEid];
    const afterVz = VelocityZ.z[renderHeroEid];
    const grounded = Grounded.value[renderHeroEid];
    const simAfterZ = PositionZ.z[heroEid];
    const simAfterVz = VelocityZ.z[heroEid];
    const simGrounded = Grounded.value[heroEid];

    expect(afterZ).toBeGreaterThan(beforeZ);
    expect(afterVz).toBeGreaterThan(beforeVz);
    expect(grounded).toBe(0);
    expect(afterZ).toBeCloseTo(simAfterZ, 4);
    expect(afterVz).toBeCloseTo(simAfterVz, 4);
    expect(grounded).toBe(simGrounded);
  });

  it('propagates hero vertical state through observer deltas', () => {
    const simWorld = createWorld({ seed: 7, ticDurationMs: 1000 / 30 });
    spawnFloorRect(simWorld, -4, -4, 4, 4, true);
    const heroEid = spawnHero(simWorld, { x: 0.5, y: 0.5 });

    const snapshot = createSnapshotSerializer(simWorld, RENDER_SNAPSHOT_COMPONENTS);
    const observer = createRenderObserverSerializer(simWorld);
    const renderWorld = createRenderWorld();

    applyRenderStream(renderWorld, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    const renderHeroes = query(renderWorld.world, [Hero, Position]);
    const renderHeroEid = renderHeroes[0];
    expect(renderHeroEid).toBeTypeOf('number');
    runTics(simWorld, 2);
    applyRenderStream(renderWorld, { kind: 'delta', buffer: observer(), tic: 2 });

    const beforeZ = PositionZ.z[renderHeroEid];
    const beforeVz = VelocityZ.z[renderHeroEid];
    const applied = debugJumpPulse(simWorld, 0.8, heroEid);
    expect(applied).toBe(1);

    runTics(simWorld, 1);
    applyRenderStream(renderWorld, { kind: 'delta', buffer: observer(), tic: 3 });

    expect(hasComponent(renderWorld.world, renderHeroEid, PositionZ)).toBe(true);
    expect(hasComponent(renderWorld.world, renderHeroEid, VelocityZ)).toBe(true);
    expect(hasComponent(renderWorld.world, renderHeroEid, Grounded)).toBe(true);
    const afterZ = PositionZ.z[renderHeroEid];
    const afterVz = VelocityZ.z[renderHeroEid];
    const afterGrounded = Grounded.value[renderHeroEid];
    expect(afterZ).toBeGreaterThan(beforeZ);
    expect(afterVz).toBeGreaterThan(beforeVz);
    expect(afterGrounded).toBe(0);
    expect(afterZ).toBeCloseTo(PositionZ.z[heroEid], 4);
    expect(afterVz).toBeCloseTo(VelocityZ.z[heroEid], 4);
    expect(afterGrounded).toBe(Grounded.value[heroEid]);
  });
});
