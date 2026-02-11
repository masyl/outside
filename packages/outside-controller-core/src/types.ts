export type ControllerFamily = 'xbox-like' | 'playstation-like' | 'nintendo-like' | 'generic';

export type FaceLayout = 'xbox' | 'playstation' | 'nintendo' | 'generic';

export type CanonicalButtonName =
  | 'south'
  | 'east'
  | 'west'
  | 'north'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftTrigger'
  | 'rightTrigger'
  | 'select'
  | 'start'
  | 'leftStick'
  | 'rightStick'
  | 'dpadUp'
  | 'dpadDown'
  | 'dpadLeft'
  | 'dpadRight'
  | 'home'
  | 'touchpad';

export const CANONICAL_BUTTONS: readonly CanonicalButtonName[] = [
  'south',
  'east',
  'west',
  'north',
  'leftShoulder',
  'rightShoulder',
  'leftTrigger',
  'rightTrigger',
  'select',
  'start',
  'leftStick',
  'rightStick',
  'dpadUp',
  'dpadDown',
  'dpadLeft',
  'dpadRight',
  'home',
  'touchpad',
] as const;

export interface RawButtonState {
  value: number;
  pressed?: boolean;
  touched?: boolean;
}

export type RawButtonInput = number | RawButtonState;

export interface RawControllerSnapshot {
  id: string;
  mapping?: string;
  connected?: boolean;
  timestamp?: number;
  axes: readonly number[];
  buttons: readonly RawButtonInput[];
  preferredFamily?: ControllerFamily;
}

export interface FaceButtonLabels {
  south: string;
  east: string;
  west: string;
  north: string;
}

export interface ControllerProfile {
  key: string;
  family: ControllerFamily;
  faceLayout: FaceLayout;
  faceLabels: FaceButtonLabels;
}

export interface ControllerCoreConfig {
  deadzone: number;
  triggerThreshold: number;
  buttonPressThreshold: number;
  directionThreshold: number;
  repeatInitialDelayMs: number;
  repeatIntervalMs: number;
  repeatableActions: readonly ControllerActionName[];
}

export type ControllerActionName =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'TERTIARY'
  | 'QUATERNARY'
  | 'LEFT_SHOULDER'
  | 'RIGHT_SHOULDER'
  | 'LEFT_TRIGGER'
  | 'RIGHT_TRIGGER'
  | 'SELECT'
  | 'START'
  | 'HOME'
  | 'LEFT_STICK'
  | 'RIGHT_STICK';

export const CONTROLLER_ACTION_ORDER: readonly ControllerActionName[] = [
  'MOVE_UP',
  'MOVE_DOWN',
  'MOVE_LEFT',
  'MOVE_RIGHT',
  'PRIMARY',
  'SECONDARY',
  'TERTIARY',
  'QUATERNARY',
  'LEFT_SHOULDER',
  'RIGHT_SHOULDER',
  'LEFT_TRIGGER',
  'RIGHT_TRIGGER',
  'SELECT',
  'START',
  'HOME',
  'LEFT_STICK',
  'RIGHT_STICK',
] as const;

export type ControllerActionPhase = 'pressed' | 'released' | 'repeat';

export interface NormalizedButtonState {
  value: number;
  pressed: boolean;
  touched: boolean;
}

export interface NormalizedStickState {
  x: number;
  y: number;
  magnitude: number;
}

export interface NormalizedControllerState {
  profile: ControllerProfile;
  connected: boolean;
  mapping: string;
  id: string;
  timestamp?: number;
  sticks: {
    left: NormalizedStickState;
    right: NormalizedStickState;
  };
  triggers: {
    left: number;
    right: number;
  };
  direction: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  buttons: Record<CanonicalButtonName, NormalizedButtonState>;
}

export interface ControllerActionEvent {
  action: ControllerActionName;
  phase: ControllerActionPhase;
  atMs: number;
}

export interface ControllerFrameResult {
  atMs: number;
  profile: ControllerProfile;
  normalized: NormalizedControllerState;
  actions: ControllerActionEvent[];
}
