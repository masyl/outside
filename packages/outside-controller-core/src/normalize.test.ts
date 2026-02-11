import { describe, expect, it } from 'vitest';
import { createControllerCoreConfig } from './processor';
import { normalizeControllerSnapshot } from './normalize';
import { RawControllerSnapshot } from './types';

function createSnapshot(overrides: Partial<RawControllerSnapshot> = {}): RawControllerSnapshot {
  return {
    id: 'Xbox Wireless Controller',
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: new Array(18).fill(0),
    ...overrides,
  };
}

describe('normalizeControllerSnapshot', () => {
  it('applies axis deadzone and keeps values outside deadzone', () => {
    const snapshot = createSnapshot({
      axes: [0.1, -0.25, 0.14, -0.8],
    });

    const config = createControllerCoreConfig({
      deadzone: 0.15,
      directionThreshold: 0.5,
    });

    const state = normalizeControllerSnapshot(snapshot, config);

    expect(state.sticks.left.x).toBe(0);
    expect(state.sticks.left.y).toBe(-0.25);
    expect(state.sticks.right.x).toBe(0);
    expect(state.sticks.right.y).toBe(-0.8);
  });

  it('resolves digital direction from stick and dpad', () => {
    const buttons = new Array(18).fill(0);
    buttons[14] = 1;

    const snapshot = createSnapshot({
      axes: [0.7, -0.9, 0, 0],
      buttons,
    });

    const config = createControllerCoreConfig({
      directionThreshold: 0.5,
    });

    const state = normalizeControllerSnapshot(snapshot, config);

    expect(state.direction.up).toBe(true);
    expect(state.direction.right).toBe(true);
    expect(state.direction.left).toBe(true);
    expect(state.direction.down).toBe(false);
  });

  it('normalizes trigger and button pressed state by threshold', () => {
    const buttons = new Array(18).fill(0);
    buttons[0] = 0.49;
    buttons[6] = 0.7;

    const snapshot = createSnapshot({ buttons });
    const config = createControllerCoreConfig({
      buttonPressThreshold: 0.5,
      triggerThreshold: 0.6,
    });

    const state = normalizeControllerSnapshot(snapshot, config);

    expect(state.buttons.south.pressed).toBe(false);
    expect(state.buttons.leftTrigger.pressed).toBe(true);
    expect(state.triggers.left).toBe(0.7);
  });
});
