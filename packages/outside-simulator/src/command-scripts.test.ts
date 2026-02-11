import { describe, expect, it } from 'vitest';
import {
  configureCommandScriptFailurePolicy,
  createWorld,
  drainCommandScriptErrors,
  drainCommandScriptTrace,
  getComponent,
  queueCommandScript,
  registerCommandScript,
  runTics,
  spawnBot,
  Direction,
  Speed,
} from './index';

const SET_MOVEMENT_SCRIPT = `
local host = __outside_command_host
local eid = host.get_arg_number('entityId', -1)
local direction = host.get_arg_number('directionRad', 0)
local speed = host.get_arg_number('tilesPerSec', 0)
host.queue_set_direction(eid, direction)
host.queue_set_speed(eid, speed)
host.trace('movement_applied')
`;

describe('command scripts', () => {
  it('should execute queued command scripts and apply queued host commands', () => {
    const world = createWorld({
      seed: 80,
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
      id: 'set-movement',
      source: SET_MOVEMENT_SCRIPT,
    });

    queueCommandScript(world, {
      commandId: 'set-movement',
      args: {
        entityId: bot,
        directionRad: 1.25,
        tilesPerSec: 2.5,
      },
    });
    runTics(world, 1);

    const direction = getComponent(world, bot, Direction);
    const speed = getComponent(world, bot, Speed);
    expect(direction.angle).toBeCloseTo(1.25, 6);
    expect(speed.tilesPerSec).toBeCloseTo(2.5, 6);
    expect(drainCommandScriptTrace(world)).toEqual(['set-movement|0|movement_applied']);
  });

  it('should execute queued command scripts in deterministic queue order', () => {
    const world = createWorld({
      seed: 81,
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
host.trace(tostring(speed))
`,
    });

    queueCommandScript(world, {
      commandId: 'set-speed',
      args: { entityId: bot, tilesPerSec: 1.5 },
    });
    queueCommandScript(world, {
      commandId: 'set-speed',
      args: { entityId: bot, tilesPerSec: 3.25 },
    });
    runTics(world, 1);

    const speed = getComponent(world, bot, Speed);
    expect(speed.tilesPerSec).toBeCloseTo(3.25, 6);
    expect(drainCommandScriptTrace(world)).toEqual(['set-speed|0|1.5', 'set-speed|1|3.25']);
  });

  it('should fail fast by default for unknown command script ids', () => {
    const world = createWorld({
      seed: 82,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });
    queueCommandScript(world, {
      commandId: 'missing-command',
      args: {},
    });
    expect(() => runTics(world, 1)).toThrow(/unknown command script id/);
  });

  it('should continue running command scripts when failure policy is continue', () => {
    const world = createWorld({
      seed: 83,
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

    configureCommandScriptFailurePolicy(world, 'continue');

    registerCommandScript(world, {
      id: 'broken',
      source: "error('broken command')",
    });
    registerCommandScript(world, {
      id: 'set-speed',
      source: `
local host = __outside_command_host
local eid = host.get_arg_number('entityId', -1)
host.queue_set_speed(eid, host.get_arg_number('tilesPerSec', 0))
host.trace('ok')
`,
    });

    queueCommandScript(world, {
      commandId: 'broken',
      args: {},
    });
    queueCommandScript(world, {
      commandId: 'set-speed',
      args: { entityId: bot, tilesPerSec: 4.5 },
    });
    runTics(world, 1);

    const speed = getComponent(world, bot, Speed);
    expect(speed.tilesPerSec).toBeCloseTo(4.5, 6);
    expect(drainCommandScriptTrace(world)).toEqual(['set-speed|1|ok']);

    const errors = drainCommandScriptErrors(world);
    expect(errors).toHaveLength(1);
    expect(errors[0].commandId).toBe('broken');
    expect(errors[0].message).toContain('broken command');
  });
});
