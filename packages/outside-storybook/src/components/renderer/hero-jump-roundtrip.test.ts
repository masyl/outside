import { describe, expect, it } from 'vitest';
import { applyRenderStream, createRenderWorld } from '@outside/renderer';
import {
  Grounded,
  Hero,
  Position,
  PositionZ,
  VelocityZ,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  debugJumpPulse,
  getViewportFollowTarget,
  query,
  runTics,
  RENDER_SNAPSHOT_COMPONENTS,
} from '@outside/simulator';
import { spawnDungeonWithFoodAndHero } from '../simulator/spawnCloud';

describe('hero jump roundtrip in dungeon story shape', () => {
  it('keeps renderer hero vertical state in sync after debug jump', () => {
    const sim = createWorld({ seed: 1, ticDurationMs: 1000 / 30 });
    spawnDungeonWithFoodAndHero(sim, 1, 0, {
      botCount: 0,
      foodCount: 0,
      dogCount: 10,
      catCount: 0,
    });

    const simHeroEid = getViewportFollowTarget(sim);
    expect(simHeroEid).toBeGreaterThan(0);

    const snapshot = createSnapshotSerializer(sim, RENDER_SNAPSHOT_COMPONENTS);
    const observer = createRenderObserverSerializer(sim);
    const render = createRenderWorld();

    applyRenderStream(render, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    const renderHeroes = query(render.world, [Hero, Position]);
    expect(renderHeroes.length).toBeGreaterThan(0);
    const renderHeroEid = renderHeroes[0];

    runTics(sim, 2);
    applyRenderStream(render, { kind: 'delta', buffer: observer(), tic: 2 });

    const beforeRenderZ = PositionZ.z[renderHeroEid];
    const beforeRenderVz = VelocityZ.z[renderHeroEid];
    const beforeRenderGrounded = Grounded.value[renderHeroEid];

    const applied = debugJumpPulse(sim, 0.8, simHeroEid);
    expect(applied).toBe(1);

    let maxRenderZ = beforeRenderZ;
    let sawAirborne = false;
    for (let tic = 3; tic <= 20; tic++) {
      runTics(sim, 1);
      applyRenderStream(render, { kind: 'delta', buffer: observer(), tic });

      const simZ = PositionZ.z[simHeroEid];
      const renderZ = PositionZ.z[renderHeroEid];
      const simVz = VelocityZ.z[simHeroEid];
      const renderVz = VelocityZ.z[renderHeroEid];
      const simGrounded = Grounded.value[simHeroEid];
      const renderGrounded = Grounded.value[renderHeroEid];

      expect(renderZ).toBeCloseTo(simZ, 4);
      expect(renderVz).toBeCloseTo(simVz, 4);
      expect(renderGrounded).toBe(simGrounded);
      maxRenderZ = Math.max(maxRenderZ, renderZ);
      if ((renderGrounded ?? 1) === 0) {
        sawAirborne = true;
      }
    }

    expect(maxRenderZ).toBeGreaterThan(beforeRenderZ + 0.2);
    expect(Number.isFinite(beforeRenderVz)).toBe(true);
    expect(beforeRenderGrounded).toBe(1);
    expect(sawAirborne).toBe(true);
  });
});
