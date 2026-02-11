import { ControllerActionName, ControllerCoreConfig } from './types';

export const DEFAULT_REPEATABLE_ACTIONS: readonly ControllerActionName[] = [
  'MOVE_UP',
  'MOVE_DOWN',
  'MOVE_LEFT',
  'MOVE_RIGHT',
] as const;

export const DEFAULT_CONTROLLER_CORE_CONFIG: ControllerCoreConfig = {
  deadzone: 0.15,
  triggerThreshold: 0.5,
  buttonPressThreshold: 0.5,
  directionThreshold: 0.5,
  repeatInitialDelayMs: 250,
  repeatIntervalMs: 80,
  repeatableActions: DEFAULT_REPEATABLE_ACTIONS,
};
