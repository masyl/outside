import { describe, expect, it } from 'vitest';
import {
  configureEventScriptFailurePolicy,
  createWorld,
  drainEventScriptErrors,
  drainEventScriptTrace,
  emitScriptEvent,
  getComponent,
  registerCommandScript,
  registerEventScript,
  runTics,
  spawnBot,
  Speed,
} from './index';

describe('event scripts', () => {
  it('should dispatch engine collision events to event scripts and queue command scripts', () => {
    const world = createWorld({
      seed: 91,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });
    const botA = spawnBot(world, {
      x: 0,
      y: 0,
      diameter: 2,
      urge: 'none',
      tilesPerSec: 2,
      directionRad: 0,
    });
    const botB = spawnBot(world, {
      x: 1,
      y: 0,
      diameter: 2,
      urge: 'none',
      tilesPerSec: 2,
      directionRad: Math.PI,
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

    registerEventScript(world, {
      id: 'collision-stop',
      channel: 'collision',
      source: `
local host = __outside_event_host
local a = host.get_event_number('entityA', -1)
local b = host.get_event_number('entityB', -1)
host.queue_command('set-speed', 'entityId', a, 'tilesPerSec', 0)
host.queue_command('set-speed', 'entityId', b, 'tilesPerSec', 0)
host.trace('collision_seen')
`,
    });

    runTics(world, 1);

    const speedA = getComponent(world, botA, Speed);
    const speedB = getComponent(world, botB, Speed);
    expect(speedA.tilesPerSec).toBeCloseTo(0, 6);
    expect(speedB.tilesPerSec).toBeCloseTo(0, 6);
    expect(drainEventScriptTrace(world)).toEqual(['collision|collision-stop|0|collision_seen']);
  });

  it('should dispatch custom emitted events', () => {
    const world = createWorld({
      seed: 92,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    registerEventScript(world, {
      id: 'ping-handler',
      channel: 'logic.ping',
      source: `
local host = __outside_event_host
local value = host.get_event_number('value', -1)
host.trace(tostring(value))
`,
    });

    emitScriptEvent(world, {
      channel: 'logic.ping',
      payload: { value: 42 },
    });
    runTics(world, 1);

    expect(drainEventScriptTrace(world)).toEqual(['logic.ping|ping-handler|0|42.0']);
  });

  it('should fail fast by default for broken event scripts', () => {
    const world = createWorld({
      seed: 93,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });
    registerEventScript(world, {
      id: 'broken-handler',
      channel: 'logic.fail',
      source: "error('broken event')",
    });
    emitScriptEvent(world, {
      channel: 'logic.fail',
      payload: {},
    });
    expect(() => runTics(world, 1)).toThrow(/event script failed/);
  });

  it('should continue handlers when failure policy is continue', () => {
    const world = createWorld({
      seed: 94,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });

    configureEventScriptFailurePolicy(world, 'continue');

    registerEventScript(world, {
      id: 'broken-handler',
      channel: 'logic.continue',
      source: "error('broken event continue')",
      priority: 0,
    });
    registerEventScript(world, {
      id: 'healthy-handler',
      channel: 'logic.continue',
      source: "__outside_event_host.trace('healthy')",
      priority: 1,
    });

    emitScriptEvent(world, {
      channel: 'logic.continue',
      payload: {},
    });
    runTics(world, 1);

    expect(drainEventScriptTrace(world)).toEqual(['logic.continue|healthy-handler|0|healthy']);

    const errors = drainEventScriptErrors(world);
    expect(errors).toHaveLength(1);
    expect(errors[0].scriptId).toBe('broken-handler');
    expect(errors[0].channel).toBe('logic.continue');
    expect(errors[0].message).toContain('broken event continue');
  });
});
