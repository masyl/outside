import { describe, expect, it } from 'vitest';
import {
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
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

describe('jump tic-by-tic pipeline', () => {
  it('keeps simulator and renderer vertical state aligned each tic after jump', () => {
    const sim = createWorld({ seed: 9, ticDurationMs: 1000 / 30 });
    spawnFloorRect(sim, -4, -4, 4, 4, true);
    const heroEid = spawnHero(sim, { x: 0.5, y: 0.5 });

    const snapshot = createSnapshotSerializer(sim, [...RENDER_SNAPSHOT_COMPONENTS]);
    const observer = createRenderObserverSerializer(sim);
    const render = createRenderWorld();

    applyRenderStream(render, { kind: 'snapshot', buffer: snapshot(), tic: 0 });
    const renderHeroes = query(render.world, [Hero, Position]);
    const renderHeroEid = renderHeroes[0];
    expect(renderHeroEid).toBeTypeOf('number');

    // Warm up one tic so physics world is initialized and hero is grounded in both worlds.
    runTics(sim, 1);
    applyRenderStream(render, { kind: 'delta', buffer: observer(), tic: 1 });

    const applied = debugJumpPulse(sim, 0.8, heroEid);
    expect(applied).toBe(1);

    let sawAirborne = false;
    let sawPositiveLift = false;
    for (let tic = 2; tic <= 18; tic++) {
      runTics(sim, 1);
      applyRenderStream(render, { kind: 'delta', buffer: observer(), tic });

      const simZ = PositionZ.z[heroEid];
      const renderZ = PositionZ.z[renderHeroEid];
      const simVz = VelocityZ.z[heroEid];
      const renderVz = VelocityZ.z[renderHeroEid];
      const simGrounded = Grounded.value[heroEid];
      const renderGrounded = Grounded.value[renderHeroEid];

      expect(renderZ).toBeCloseTo(simZ, 5);
      expect(renderVz).toBeCloseTo(simVz, 5);
      expect(renderGrounded).toBe(simGrounded);

      if ((renderGrounded ?? 1) === 0) {
        sawAirborne = true;
      }
      if ((renderZ ?? 0) > 0.45) {
        sawPositiveLift = true;
      }
    }

    expect(sawAirborne).toBe(true);
    expect(sawPositiveLift).toBe(true);
  });
});
