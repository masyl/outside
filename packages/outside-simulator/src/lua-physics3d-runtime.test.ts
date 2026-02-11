import { describe, expect, it } from 'vitest';
import { createWorld } from './world';
import { runTics } from './run';
import { setPhysics3dCoreScriptOverrides } from './systems/physics3d-core-script-runtime';

describe('physics3d core Lua runtime', () => {
  it('fails fast when a phase script throws', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    setPhysics3dCoreScriptOverrides(world, {
      step_world: 'error("forced step_world failure")',
    });

    expect(() => runTics(world, 1)).toThrowError(/step_world/);
  });

  it('runs normally after overrides are cleared', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    setPhysics3dCoreScriptOverrides(world, {
      step_world: 'error("forced step_world failure")',
    });
    expect(() => runTics(world, 1)).toThrowError();

    setPhysics3dCoreScriptOverrides(world, null);
    expect(() => runTics(world, 1)).not.toThrow();
  });

  it('records per-phase runtime metrics during lua execution', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    runTics(world, 2);

    expect(world.physics3dRuntimeMetrics.ticCountMeasured).toBe(2);
    expect(world.physics3dRuntimeMetrics.lastTicTotalMs).toBeGreaterThanOrEqual(0);
    expect(world.physics3dRuntimeMetrics.totalMs).toBeGreaterThanOrEqual(
      world.physics3dRuntimeMetrics.lastTicTotalMs
    );
    expect(world.physics3dRuntimeMetrics.lastTicMsByPhase.step_world).toBeGreaterThanOrEqual(0);
    expect(world.physics3dRuntimeMetrics.totalMsByPhase.step_world).toBeGreaterThanOrEqual(0);
    expect(world.physics3dRuntimeMetrics.lastTicMsByPhase.ensure_state).toBeGreaterThanOrEqual(0);
    expect(world.physics3dRuntimeMetrics.totalMsByPhase.sync_back_to_ecs).toBeGreaterThanOrEqual(
      0
    );
  });
});
