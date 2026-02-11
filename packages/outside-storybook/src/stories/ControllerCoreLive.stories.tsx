import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ControllerInputProcessor,
  createControllerCoreConfig,
  resolveActiveActions,
  type ControllerActionEvent,
  type NormalizedControllerState,
  type RawControllerSnapshot,
} from '@outside/controller-core';

interface LiveControllerPreviewProps {
  deadzone: number;
  directionThreshold: number;
  buttonPressThreshold: number;
  triggerThreshold: number;
  repeatInitialDelayMs: number;
  repeatIntervalMs: number;
  pollFps: number;
}

interface GamepadInfo {
  index: number;
  id: string;
  mapping: string;
}

interface GamepadButtonView {
  index: number;
  label: string;
  value: number;
  pressed: boolean;
  touched: boolean;
}

interface LiveFrame {
  atMs: number;
  id: string;
  mapping: string;
  profileKey: string;
  normalized: NormalizedControllerState;
  snapshot: RawControllerSnapshot;
  axes: number[];
  buttons: GamepadButtonView[];
  activeActions: string[];
  actionEvents: ControllerActionEvent[];
}

const STANDARD_BUTTON_LABELS: readonly string[] = [
  'South',
  'East',
  'West',
  'North',
  'L1',
  'R1',
  'L2',
  'R2',
  'Select / Share',
  'Start / Options',
  'L3',
  'R3',
  'DPad Up',
  'DPad Down',
  'DPad Left',
  'DPad Right',
  'Home / PS',
  'Touchpad / Misc',
];

function getButtonLabel(index: number): string {
  return STANDARD_BUTTON_LABELS[index] ?? `Button ${index}`;
}

function toRawSnapshot(gamepad: Gamepad): RawControllerSnapshot {
  return {
    id: gamepad.id,
    mapping: gamepad.mapping ?? '',
    connected: gamepad.connected,
    timestamp: Number.isFinite(gamepad.timestamp) ? gamepad.timestamp : undefined,
    axes: Array.from(gamepad.axes),
    buttons: Array.from(gamepad.buttons).map((button) => ({
      value: button.value,
      pressed: button.pressed,
      touched: button.touched,
    })),
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

function StickCard({
  title,
  x,
  y,
  magnitude,
}: {
  title: string;
  x: number;
  y: number;
  magnitude: number;
}) {
  return (
    <div
      style={{
        minWidth: 260,
        flex: '1 1 280px',
        padding: 12,
        borderRadius: 8,
        background: '#111827',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>{title}</h3>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 64px', gap: 8 }}>
          <span>X</span>
          <div style={{ background: '#1f2937', borderRadius: 4, overflow: 'hidden', height: 12 }}>
            <div
              style={{
                background: '#34d399',
                height: '100%',
                width: `${((x + 1) / 2) * 100}%`,
              }}
            />
          </div>
          <span style={{ textAlign: 'right' }}>{x.toFixed(3)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 64px', gap: 8 }}>
          <span>Y</span>
          <div style={{ background: '#1f2937', borderRadius: 4, overflow: 'hidden', height: 12 }}>
            <div
              style={{
                background: '#60a5fa',
                height: '100%',
                width: `${((y + 1) / 2) * 100}%`,
              }}
            />
          </div>
          <span style={{ textAlign: 'right' }}>{y.toFixed(3)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 64px', gap: 8 }}>
          <span>Magnitude</span>
          <div style={{ background: '#1f2937', borderRadius: 4, overflow: 'hidden', height: 12 }}>
            <div
              style={{
                background: '#f59e0b',
                height: '100%',
                width: `${magnitude * 100}%`,
              }}
            />
          </div>
          <span style={{ textAlign: 'right' }}>{magnitude.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

function LiveControllerPreview(props: LiveControllerPreviewProps) {
  const isGamepadSupported =
    typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';

  const [availablePads, setAvailablePads] = useState<GamepadInfo[]>([]);
  const [selectedPadIndex, setSelectedPadIndex] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [frame, setFrame] = useState<LiveFrame | null>(null);
  const [lastFrameTimeMs, setLastFrameTimeMs] = useState<number | null>(null);

  const config = useMemo(
    () =>
      createControllerCoreConfig({
        deadzone: props.deadzone,
        directionThreshold: props.directionThreshold,
        buttonPressThreshold: props.buttonPressThreshold,
        triggerThreshold: props.triggerThreshold,
        repeatInitialDelayMs: props.repeatInitialDelayMs,
        repeatIntervalMs: props.repeatIntervalMs,
      }),
    [
      props.buttonPressThreshold,
      props.deadzone,
      props.directionThreshold,
      props.repeatInitialDelayMs,
      props.repeatIntervalMs,
      props.triggerThreshold,
    ]
  );

  const processorRef = useRef<ControllerInputProcessor>(new ControllerInputProcessor(config));

  useEffect(() => {
    processorRef.current = new ControllerInputProcessor(config);
  }, [config]);

  const refreshPads = useCallback(() => {
    if (!isGamepadSupported) {
      return;
    }

    const pads = Array.from(navigator.getGamepads())
      .filter((pad): pad is Gamepad => pad != null && pad.connected)
      .map((pad) => ({
        index: pad.index,
        id: pad.id,
        mapping: pad.mapping ?? '',
      }));

    setAvailablePads(pads);

    setSelectedPadIndex((current) => {
      if (current != null && pads.some((pad) => pad.index === current)) {
        return current;
      }
      return pads.length > 0 ? pads[0].index : null;
    });
  }, [isGamepadSupported]);

  useEffect(() => {
    if (!isGamepadSupported) {
      return;
    }

    const onGamepadChange = () => {
      refreshPads();
    };

    window.addEventListener('gamepadconnected', onGamepadChange);
    window.addEventListener('gamepaddisconnected', onGamepadChange);

    refreshPads();

    return () => {
      window.removeEventListener('gamepadconnected', onGamepadChange);
      window.removeEventListener('gamepaddisconnected', onGamepadChange);
    };
  }, [isGamepadSupported, refreshPads]);

  useEffect(() => {
    if (!isGamepadSupported || !isPolling) {
      return;
    }

    let rafId = 0;
    let lastTickAt = 0;
    const minIntervalMs = Math.max(1, Math.floor(1000 / Math.max(1, props.pollFps)));

    const tick = (now: number) => {
      if (now - lastTickAt >= minIntervalMs) {
        const pads = navigator.getGamepads();
        const selected = selectedPadIndex != null ? pads[selectedPadIndex] : null;
        const fallback = Array.from(pads).find(
          (pad): pad is Gamepad => pad != null && pad.connected
        );
        const activePad = selected && selected.connected ? selected : fallback;

        if (activePad != null) {
          const snapshot = toRawSnapshot(activePad);
          const result = processorRef.current.process(snapshot, now);

          setFrame({
            atMs: now,
            id: activePad.id,
            mapping: activePad.mapping ?? '',
            profileKey: result.profile.key,
            normalized: result.normalized,
            snapshot,
            axes: Array.from(activePad.axes).map((value) => Number(value.toFixed(4))),
            buttons: Array.from(activePad.buttons).map((button, index) => ({
              index,
              label: getButtonLabel(index),
              value: Number(button.value.toFixed(4)),
              pressed: button.pressed,
              touched: button.touched,
            })),
            activeActions: Array.from(resolveActiveActions(result.normalized)),
            actionEvents: result.actions,
          });

          setLastFrameTimeMs(now);
          setSelectedPadIndex(activePad.index);
        } else {
          setFrame(null);
        }

        lastTickAt = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isGamepadSupported, isPolling, props.pollFps, selectedPadIndex]);

  if (!isGamepadSupported) {
    return (
      <div style={{ padding: 16, fontFamily: 'Monaco, Menlo, Consolas, monospace' }}>
        <h2 style={{ marginTop: 0 }}>Controller Core Live Gamepad Monitor</h2>
        <p>Gamepad API is not available in this browser context.</p>
      </div>
    );
  }

  const hasPad = availablePads.length > 0;
  const activeButtons =
    frame?.buttons.filter((button) => button.pressed || button.value > 0.01) ?? [];

  return (
    <div style={{ padding: 16, fontFamily: 'Monaco, Menlo, Consolas, monospace' }}>
      <h2 style={{ marginTop: 0 }}>Controller Core Live Gamepad Monitor</h2>
      <p style={{ maxWidth: 980 }}>
        Connect your controller, open this story, click <strong>Start Polling</strong>, then press
        buttons or move sticks. This view reads the real browser Gamepad input and shows both raw
        and normalized outputs.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <button type="button" onClick={refreshPads}>
          Refresh Devices
        </button>
        <button type="button" onClick={() => setIsPolling((value) => !value)} disabled={!hasPad}>
          {isPolling ? 'Stop Polling' : 'Start Polling'}
        </button>
        <label>
          Active Device:{' '}
          <select
            value={selectedPadIndex ?? ''}
            onChange={(event) => setSelectedPadIndex(Number(event.target.value))}
            disabled={!hasPad}
          >
            {!hasPad ? <option value="">No devices detected</option> : null}
            {availablePads.map((pad) => (
              <option key={pad.index} value={pad.index}>
                #{pad.index} {pad.id || '(unlabeled)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Status:</strong> {isPolling ? 'Polling' : 'Paused'} |{' '}
        <strong>Detected pads:</strong> {availablePads.length} | <strong>Last frame:</strong>{' '}
        {lastFrameTimeMs != null ? `${Math.round(lastFrameTimeMs)} ms` : 'none'}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Tips:</strong> In Chrome, press any controller button after connecting to expose
        live input. Keep the Storybook iframe focused while testing.
      </div>

      {frame == null ? (
        <div style={{ padding: 12, borderRadius: 8, background: '#1f2937', color: '#e5e7eb' }}>
          No active frame yet. Start polling and press a controller button.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <strong>Profile:</strong> {frame.profileKey} | <strong>Mapping:</strong>{' '}
            {frame.mapping || '(none)'}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Sticks (Separated)</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StickCard
                title="Left Stick"
                x={frame.normalized.sticks.left.x}
                y={frame.normalized.sticks.left.y}
                magnitude={frame.normalized.sticks.left.magnitude}
              />
              <StickCard
                title="Right Stick"
                x={frame.normalized.sticks.right.x}
                y={frame.normalized.sticks.right.y}
                magnitude={frame.normalized.sticks.right.magnitude}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Pressed Buttons ({activeButtons.length})</h3>
            {activeButtons.length === 0 ? (
              <div>None</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activeButtons.map((button) => (
                  <div
                    key={button.index}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: '#14532d',
                      color: '#dcfce7',
                      fontSize: 12,
                    }}
                  >
                    {button.label} (#{button.index}) = {button.value.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Axes</h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {frame.axes.map((value, index) => (
                <div
                  key={index}
                  style={{ display: 'grid', gridTemplateColumns: '84px 1fr 64px', gap: 8 }}
                >
                  <span>Axis {index}</span>
                  <div
                    style={{
                      background: '#111827',
                      borderRadius: 4,
                      overflow: 'hidden',
                      height: 12,
                    }}
                  >
                    <div
                      style={{
                        background: '#22d3ee',
                        height: '100%',
                        width: `${((value + 1) / 2) * 100}%`,
                      }}
                    />
                  </div>
                  <span style={{ textAlign: 'right' }}>{value.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <JsonPanel title="Action Events (This Frame)" value={frame.actionEvents} />
            <JsonPanel title="Active Actions" value={frame.activeActions} />
            <JsonPanel title="Raw Snapshot" value={frame.snapshot} />
          </div>
        </>
      )}
    </div>
  );
}

const meta: Meta<typeof LiveControllerPreview> = {
  title: 'INPUT/Controller Core Live',
  component: LiveControllerPreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Live Gamepad monitor for real hardware testing. Reads navigator.getGamepads() and renders raw + normalized controller-core outputs in real time.',
      },
    },
  },
  argTypes: {
    deadzone: { control: { type: 'range', min: 0, max: 0.5, step: 0.01 } },
    directionThreshold: { control: { type: 'range', min: 0.1, max: 1, step: 0.01 } },
    buttonPressThreshold: { control: { type: 'range', min: 0.1, max: 1, step: 0.01 } },
    triggerThreshold: { control: { type: 'range', min: 0.1, max: 1, step: 0.01 } },
    repeatInitialDelayMs: { control: { type: 'number', min: 0, max: 1000, step: 10 } },
    repeatIntervalMs: { control: { type: 'number', min: 10, max: 500, step: 10 } },
    pollFps: { control: { type: 'number', min: 10, max: 240, step: 5 } },
  },
  args: {
    deadzone: 0.15,
    directionThreshold: 0.5,
    buttonPressThreshold: 0.5,
    triggerThreshold: 0.5,
    repeatInitialDelayMs: 250,
    repeatIntervalMs: 80,
    pollFps: 60,
  },
};

export default meta;

export const LiveGamepadPreview: StoryObj<typeof LiveControllerPreview> = {};
