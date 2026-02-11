import { DEFAULT_CONTROLLER_CORE_CONFIG } from './defaults';
import { resolveControllerProfile } from './profiles';
import {
  CANONICAL_BUTTONS,
  CanonicalButtonName,
  ControllerCoreConfig,
  NormalizedButtonState,
  NormalizedControllerState,
  RawButtonInput,
  RawControllerSnapshot,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeAxis(rawValue: number | undefined, deadzone: number): number {
  if (!Number.isFinite(rawValue)) {
    return 0;
  }

  const clamped = clamp(rawValue as number, -1, 1);
  if (Math.abs(clamped) < deadzone) {
    return 0;
  }

  return clamped;
}

function readButton(input: RawButtonInput | undefined): RawButtonInput {
  if (input == null) {
    return 0;
  }
  return input;
}

function normalizeButton(input: RawButtonInput, pressThreshold: number): NormalizedButtonState {
  if (typeof input === 'number') {
    const value = clamp(input, 0, 1);
    return {
      value,
      pressed: value >= pressThreshold,
      touched: value > 0,
    };
  }

  const value = clamp(input.value, 0, 1);
  return {
    value,
    pressed: input.pressed ?? value >= pressThreshold,
    touched: input.touched ?? value > 0,
  };
}

function createButtonStateMap(
  snapshot: RawControllerSnapshot,
  config: ControllerCoreConfig
): Record<CanonicalButtonName, NormalizedButtonState> {
  const map = {} as Record<CanonicalButtonName, NormalizedButtonState>;

  for (let i = 0; i < CANONICAL_BUTTONS.length; i++) {
    const buttonName = CANONICAL_BUTTONS[i];
    const rawButton = readButton(snapshot.buttons[i]);
    map[buttonName] = normalizeButton(rawButton, config.buttonPressThreshold);
  }

  return map;
}

function computeStickMagnitude(x: number, y: number): number {
  return clamp(Math.sqrt(x * x + y * y), 0, 1);
}

export function normalizeControllerSnapshot(
  snapshot: RawControllerSnapshot,
  config: ControllerCoreConfig = DEFAULT_CONTROLLER_CORE_CONFIG
): NormalizedControllerState {
  const mapping = snapshot.mapping ?? '';
  const profile = resolveControllerProfile(snapshot.id, mapping, snapshot.preferredFamily);
  const buttons = createButtonStateMap(snapshot, config);

  const leftX = normalizeAxis(snapshot.axes[0], config.deadzone);
  const leftY = normalizeAxis(snapshot.axes[1], config.deadzone);
  const rightX = normalizeAxis(snapshot.axes[2], config.deadzone);
  const rightY = normalizeAxis(snapshot.axes[3], config.deadzone);

  const leftTrigger = buttons.leftTrigger.value;
  const rightTrigger = buttons.rightTrigger.value;

  return {
    profile,
    connected: snapshot.connected ?? true,
    mapping,
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    sticks: {
      left: {
        x: leftX,
        y: leftY,
        magnitude: computeStickMagnitude(leftX, leftY),
      },
      right: {
        x: rightX,
        y: rightY,
        magnitude: computeStickMagnitude(rightX, rightY),
      },
    },
    triggers: {
      left: leftTrigger,
      right: rightTrigger,
    },
    direction: {
      up: buttons.dpadUp.pressed || leftY <= -config.directionThreshold,
      down: buttons.dpadDown.pressed || leftY >= config.directionThreshold,
      left: buttons.dpadLeft.pressed || leftX <= -config.directionThreshold,
      right: buttons.dpadRight.pressed || leftX >= config.directionThreshold,
    },
    buttons,
  };
}
