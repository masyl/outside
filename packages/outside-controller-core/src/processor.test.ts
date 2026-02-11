import { describe, expect, it } from 'vitest';
import { ControllerInputProcessor } from './processor';
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

describe('ControllerInputProcessor', () => {
  it('emits pressed and released events in stable order', () => {
    const processor = new ControllerInputProcessor({
      repeatInitialDelayMs: 200,
      repeatIntervalMs: 100,
    });

    const idleSnapshot = createSnapshot();
    expect(processor.process(idleSnapshot, 0).actions).toEqual([]);

    const pressedButtons = new Array(18).fill(0);
    pressedButtons[0] = 1;
    pressedButtons[12] = 1;

    const pressedSnapshot = createSnapshot({ buttons: pressedButtons });
    const pressedEvents = processor.process(pressedSnapshot, 10).actions;

    expect(pressedEvents).toEqual([
      { action: 'MOVE_UP', phase: 'pressed', atMs: 10 },
      { action: 'PRIMARY', phase: 'pressed', atMs: 10 },
    ]);

    expect(processor.process(pressedSnapshot, 150).actions).toEqual([]);
    expect(processor.process(pressedSnapshot, 220).actions).toEqual([
      { action: 'MOVE_UP', phase: 'repeat', atMs: 220 },
    ]);

    const releasedEvents = processor.process(idleSnapshot, 300).actions;
    expect(releasedEvents).toEqual([
      { action: 'MOVE_UP', phase: 'released', atMs: 300 },
      { action: 'PRIMARY', phase: 'released', atMs: 300 },
    ]);
  });

  it('uses snapshot timestamp when explicit frame time is omitted', () => {
    const processor = new ControllerInputProcessor();

    const withTimestamp = createSnapshot({ timestamp: 1234 });
    const frame = processor.process(withTimestamp);

    expect(frame.atMs).toBe(1234);
  });

  it('falls back to deterministic +16ms frame step without timestamp', () => {
    const processor = new ControllerInputProcessor();

    const first = processor.process(createSnapshot());
    const second = processor.process(createSnapshot());

    expect(first.atMs).toBe(16);
    expect(second.atMs).toBe(32);
  });
});
