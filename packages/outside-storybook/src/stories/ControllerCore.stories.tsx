import React, { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ControllerFamily,
  ControllerInputProcessor,
  createControllerCoreConfig,
  detectControllerFamily,
  normalizeControllerSnapshot,
  resolveActiveActions,
  resolveControllerProfile,
  type RawControllerSnapshot,
} from '@outside/controller-core';

type PreferredFamilyArg = ControllerFamily | 'auto';

interface ControllerCoreInspectorProps {
  id: string;
  mapping: string;
  preferredFamily: PreferredFamilyArg;
  leftStickX: number;
  leftStickY: number;
  rightStickX: number;
  rightStickY: number;
  faceSouth: number;
  faceEast: number;
  faceWest: number;
  faceNorth: number;
  leftTrigger: number;
  rightTrigger: number;
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  deadzone: number;
  directionThreshold: number;
  buttonPressThreshold: number;
  triggerThreshold: number;
}

interface RepeatTimelineProps {
  repeatInitialDelayMs: number;
  repeatIntervalMs: number;
  holdDurationMs: number;
  sampleEveryMs: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function createButtonsFromProps(props: ControllerCoreInspectorProps): number[] {
  const buttons = new Array(18).fill(0);
  buttons[0] = clamp01(props.faceSouth);
  buttons[1] = clamp01(props.faceEast);
  buttons[2] = clamp01(props.faceWest);
  buttons[3] = clamp01(props.faceNorth);
  buttons[6] = clamp01(props.leftTrigger);
  buttons[7] = clamp01(props.rightTrigger);
  buttons[12] = props.dpadUp ? 1 : 0;
  buttons[13] = props.dpadDown ? 1 : 0;
  buttons[14] = props.dpadLeft ? 1 : 0;
  buttons[15] = props.dpadRight ? 1 : 0;
  return buttons;
}

function createSnapshot(props: ControllerCoreInspectorProps): RawControllerSnapshot {
  const preferredFamily: ControllerFamily | undefined =
    props.preferredFamily === 'auto' ? undefined : props.preferredFamily;

  return {
    id: props.id,
    mapping: props.mapping,
    preferredFamily,
    axes: [props.leftStickX, props.leftStickY, props.rightStickX, props.rightStickY],
    buttons: createButtonsFromProps(props),
  };
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section style={{ minWidth: 320, flex: '1 1 420px' }}>
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h3>
      <pre
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 8,
          background: '#0f172a',
          color: '#e2e8f0',
          overflowX: 'auto',
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function ControllerCoreInspector(props: ControllerCoreInspectorProps) {
  const config = useMemo(
    () =>
      createControllerCoreConfig({
        deadzone: props.deadzone,
        directionThreshold: props.directionThreshold,
        buttonPressThreshold: props.buttonPressThreshold,
        triggerThreshold: props.triggerThreshold,
      }),
    [props.buttonPressThreshold, props.deadzone, props.directionThreshold, props.triggerThreshold]
  );

  const snapshot = useMemo(() => createSnapshot(props), [props]);
  const normalized = useMemo(
    () => normalizeControllerSnapshot(snapshot, config),
    [config, snapshot]
  );
  const actions = useMemo(() => Array.from(resolveActiveActions(normalized)), [normalized]);

  const detectedFamily = detectControllerFamily(props.id, props.mapping);
  const resolvedProfile = resolveControllerProfile(
    props.id,
    props.mapping,
    props.preferredFamily === 'auto' ? undefined : props.preferredFamily
  );

  return (
    <div style={{ padding: 16, fontFamily: 'Monaco, Menlo, Consolas, monospace' }}>
      <h2 style={{ marginTop: 0 }}>Controller Core Snapshot Inspector</h2>
      <p style={{ maxWidth: 960, marginTop: 0 }}>
        This story feeds a synthetic controller snapshot into the dependency-free controller core
        library, then shows the normalized state and resolved actions.
      </p>
      <div style={{ marginBottom: 12 }}>
        <strong>Detected Family:</strong> {detectedFamily} | <strong>Resolved Profile:</strong>{' '}
        {resolvedProfile.key} ({resolvedProfile.faceLabels.south}/{resolvedProfile.faceLabels.east}/
        {resolvedProfile.faceLabels.west}/{resolvedProfile.faceLabels.north})
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <JsonPanel title="Raw Snapshot" value={snapshot} />
        <JsonPanel title="Normalized State" value={normalized} />
        <JsonPanel title="Active Actions" value={actions} />
      </div>
    </div>
  );
}

function RepeatTimelineProbe(props: RepeatTimelineProps) {
  const timeline = useMemo(() => {
    const processor = new ControllerInputProcessor({
      repeatInitialDelayMs: props.repeatInitialDelayMs,
      repeatIntervalMs: props.repeatIntervalMs,
    });

    const holdButtons = new Array(18).fill(0);
    holdButtons[12] = 1;

    const idleSnapshot: RawControllerSnapshot = {
      id: 'Xbox Wireless Controller',
      mapping: 'standard',
      axes: [0, 0, 0, 0],
      buttons: new Array(18).fill(0),
    };

    const holdSnapshot: RawControllerSnapshot = {
      id: 'Xbox Wireless Controller',
      mapping: 'standard',
      axes: [0, 0, 0, 0],
      buttons: holdButtons,
    };

    const frames: Array<{ atMs: number; events: unknown[] }> = [];
    frames.push({ atMs: 0, events: processor.process(holdSnapshot, 0).actions });

    for (
      let atMs = props.sampleEveryMs;
      atMs <= props.holdDurationMs;
      atMs += props.sampleEveryMs
    ) {
      frames.push({ atMs, events: processor.process(holdSnapshot, atMs).actions });
    }

    const releaseAt = props.holdDurationMs + props.sampleEveryMs;
    frames.push({ atMs: releaseAt, events: processor.process(idleSnapshot, releaseAt).actions });

    const allEvents = frames.flatMap((frame) => frame.events);
    return {
      config: {
        repeatInitialDelayMs: props.repeatInitialDelayMs,
        repeatIntervalMs: props.repeatIntervalMs,
      },
      frames,
      allEvents,
    };
  }, [
    props.holdDurationMs,
    props.repeatInitialDelayMs,
    props.repeatIntervalMs,
    props.sampleEveryMs,
  ]);

  return (
    <div style={{ padding: 16, fontFamily: 'Monaco, Menlo, Consolas, monospace' }}>
      <h2 style={{ marginTop: 0 }}>Controller Core Repeat Timeline Probe</h2>
      <p style={{ maxWidth: 960, marginTop: 0 }}>
        This probe holds `MOVE_UP` (D-Pad Up) for a configured duration and samples processor output
        at fixed frame intervals.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <JsonPanel title="Probe Timeline" value={timeline.frames} />
        <JsonPanel title="Flattened Events" value={timeline.allEvents} />
      </div>
    </div>
  );
}

const meta: Meta<typeof ControllerCoreInspector> = {
  title: 'INPUT/Controller Core',
  component: ControllerCoreInspector,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dependency-free controller core package inspector. Validate profile detection, axis normalization, and action resolution with synthetic snapshots.',
      },
    },
  },
  argTypes: {
    preferredFamily: {
      control: { type: 'select' },
      options: ['auto', 'xbox-like', 'playstation-like', 'nintendo-like', 'generic'],
    },
    leftStickX: { control: { type: 'range', min: -1, max: 1, step: 0.01 } },
    leftStickY: { control: { type: 'range', min: -1, max: 1, step: 0.01 } },
    rightStickX: { control: { type: 'range', min: -1, max: 1, step: 0.01 } },
    rightStickY: { control: { type: 'range', min: -1, max: 1, step: 0.01 } },
    faceSouth: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    faceEast: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    faceWest: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    faceNorth: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    leftTrigger: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    rightTrigger: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    deadzone: { control: { type: 'range', min: 0, max: 0.5, step: 0.01 } },
    directionThreshold: { control: { type: 'range', min: 0.1, max: 1, step: 0.01 } },
    buttonPressThreshold: { control: { type: 'range', min: 0.1, max: 1, step: 0.01 } },
    triggerThreshold: { control: { type: 'range', min: 0.1, max: 1, step: 0.01 } },
  },
  args: {
    id: 'Xbox Wireless Controller',
    mapping: 'standard',
    preferredFamily: 'auto',
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,
    faceSouth: 0,
    faceEast: 0,
    faceWest: 0,
    faceNorth: 0,
    leftTrigger: 0,
    rightTrigger: 0,
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
    deadzone: 0.15,
    directionThreshold: 0.5,
    buttonPressThreshold: 0.5,
    triggerThreshold: 0.5,
  },
};

export default meta;

export const SnapshotInspector: StoryObj<typeof ControllerCoreInspector> = {};

export const DualSenseExample: StoryObj<typeof ControllerCoreInspector> = {
  args: {
    id: 'Sony Interactive Entertainment DualSense Wireless Controller',
    faceSouth: 1,
    leftStickY: -0.75,
  },
};

export const NintendoExample: StoryObj<typeof ControllerCoreInspector> = {
  args: {
    id: 'Nintendo Switch Pro Controller',
    dpadRight: true,
    faceEast: 1,
  },
};

export const RepeatTimeline: StoryObj<typeof ControllerCoreInspector> = {
  render: () => (
    <RepeatTimelineProbe
      repeatInitialDelayMs={250}
      repeatIntervalMs={80}
      holdDurationMs={560}
      sampleEveryMs={80}
    />
  ),
};
