import { describe, expect, it } from 'vitest';
import {
  clearExternalSystemScripts,
  configureExternalSystemScriptFailurePolicy,
  createWorld,
  drainExternalSystemScriptErrors,
  drainExternalSystemScriptTrace,
  getComponent,
  listExternalSystemScripts,
  registerCommandScript,
  registerExternalSystemScript,
  runTics,
  spawnBot,
  Speed,
  unregisterExternalSystemScript,
} from './index';

function traceSource(label: string): string {
  return `__outside_hook_host.trace('${label}')`;
}

describe('external system script hooks', () => {
  it('should execute hooks in deterministic tic/system order', () => {
    const world = createWorld({
      seed: 7,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    registerExternalSystemScript(world, {
      id: 'tic-pre',
      hook: 'tic:pre',
      source: traceSource('tic_pre'),
    });
    registerExternalSystemScript(world, {
      id: 'pointer-pre',
      hook: 'pointer:pre',
      source: traceSource('pointer_pre'),
    });
    registerExternalSystemScript(world, {
      id: 'pointer-post',
      hook: 'pointer:post',
      source: traceSource('pointer_post'),
    });
    registerExternalSystemScript(world, {
      id: 'physics-pre',
      hook: 'physics3d:pre',
      source: traceSource('physics_pre'),
    });
    registerExternalSystemScript(world, {
      id: 'physics-post',
      hook: 'physics3d:post',
      source: traceSource('physics_post'),
    });
    registerExternalSystemScript(world, {
      id: 'tic-post',
      hook: 'tic:post',
      source: traceSource('tic_post'),
    });

    runTics(world, 1);

    expect(drainExternalSystemScriptTrace(world)).toEqual([
      'tic:pre|tic-pre|tic_pre',
      'pointer:pre|pointer-pre|pointer_pre',
      'pointer:post|pointer-post|pointer_post',
      'physics3d:pre|physics-pre|physics_pre',
      'physics3d:post|physics-post|physics_post',
      'tic:post|tic-post|tic_post',
    ]);
  });

  it('should sort hook scripts by priority then registration order', () => {
    const world = createWorld({
      seed: 12,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    registerExternalSystemScript(world, {
      id: 'priority-10',
      hook: 'tic:pre',
      source: traceSource('p10'),
      priority: 10,
    });
    registerExternalSystemScript(world, {
      id: 'priority-0-a',
      hook: 'tic:pre',
      source: traceSource('p0a'),
      priority: 0,
    });
    registerExternalSystemScript(world, {
      id: 'priority-0-b',
      hook: 'tic:pre',
      source: traceSource('p0b'),
      priority: 0,
    });

    runTics(world, 1);

    expect(drainExternalSystemScriptTrace(world)).toEqual([
      'tic:pre|priority-0-a|p0a',
      'tic:pre|priority-0-b|p0b',
      'tic:pre|priority-10|p10',
    ]);
  });

  it('should list, unregister, and clear registered scripts', () => {
    const world = createWorld({
      seed: 22,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    registerExternalSystemScript(world, {
      id: 'script-a',
      hook: 'tic:pre',
      source: traceSource('a'),
      priority: 3,
    });
    registerExternalSystemScript(world, {
      id: 'script-b',
      hook: 'tic:pre',
      source: traceSource('b'),
      priority: 1,
    });

    const listed = listExternalSystemScripts(world);
    expect(listed.map((script) => script.id)).toEqual(['script-b', 'script-a']);

    expect(unregisterExternalSystemScript(world, 'script-a')).toBe(true);
    expect(unregisterExternalSystemScript(world, 'missing-script')).toBe(false);
    expect(listExternalSystemScripts(world).map((script) => script.id)).toEqual(['script-b']);

    clearExternalSystemScripts(world);
    expect(listExternalSystemScripts(world)).toEqual([]);
  });

  it('should fail fast by default when a script throws', () => {
    const world = createWorld({
      seed: 14,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    registerExternalSystemScript(world, {
      id: 'boom',
      hook: 'tic:pre',
      source: "error('boom')",
    });

    expect(() => runTics(world, 1)).toThrow(/external system script failed/);
    clearExternalSystemScripts(world);
  });

  it('should continue other scripts when policy is continue', () => {
    const world = createWorld({
      seed: 99,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    configureExternalSystemScriptFailurePolicy(world, 'continue');

    registerExternalSystemScript(world, {
      id: 'failing-script',
      hook: 'tic:pre',
      source: "error('broken script')",
      priority: 0,
    });
    registerExternalSystemScript(world, {
      id: 'following-script',
      hook: 'tic:pre',
      source: traceSource('still_running'),
      priority: 1,
    });
    registerExternalSystemScript(world, {
      id: 'tic-post-script',
      hook: 'tic:post',
      source: traceSource('tic_post_ran'),
    });

    runTics(world, 1);

    expect(drainExternalSystemScriptTrace(world)).toEqual([
      'tic:pre|following-script|still_running',
      'tic:post|tic-post-script|tic_post_ran',
    ]);

    const errors = drainExternalSystemScriptErrors(world);
    expect(errors).toHaveLength(1);
    expect(errors[0].scriptId).toBe('failing-script');
    expect(errors[0].hook).toBe('tic:pre');
    expect(errors[0].message).toContain('broken script');
  });

  it('should allow external hook scripts to enqueue command scripts', () => {
    const world = createWorld({
      seed: 64,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });
    const bot = spawnBot(world, {
      x: 0,
      y: 0,
      urge: 'none',
      tilesPerSec: 0,
      directionRad: 0,
    });

    registerCommandScript(world, {
      id: 'set-speed',
      source: `
local host = __outside_command_host
local eid = host.get_arg_number('entityId', -1)
local speed = host.get_arg_number('tilesPerSec', 0)
host.queue_set_speed(eid, speed)
`,
    });

    registerExternalSystemScript(world, {
      id: 'enqueue-command',
      hook: 'tic:pre',
      source: `__outside_hook_host.queue_command('set-speed', 'entityId', ${bot}, 'tilesPerSec', 6.2)`,
    });

    runTics(world, 1);

    const speed = getComponent(world, bot, Speed);
    expect(speed.tilesPerSec).toBeCloseTo(6.2, 6);
  });
});
