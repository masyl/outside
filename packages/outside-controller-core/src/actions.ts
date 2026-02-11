import { DEFAULT_CONTROLLER_CORE_CONFIG } from './defaults';
import { ControllerActionName, ControllerCoreConfig, NormalizedControllerState } from './types';

export function resolveActiveActions(
  state: NormalizedControllerState,
  config: ControllerCoreConfig = DEFAULT_CONTROLLER_CORE_CONFIG
): Set<ControllerActionName> {
  const actions = new Set<ControllerActionName>();

  if (state.direction.up) {
    actions.add('MOVE_UP');
  }
  if (state.direction.down) {
    actions.add('MOVE_DOWN');
  }
  if (state.direction.left) {
    actions.add('MOVE_LEFT');
  }
  if (state.direction.right) {
    actions.add('MOVE_RIGHT');
  }

  if (state.buttons.south.pressed) {
    actions.add('PRIMARY');
  }
  if (state.buttons.east.pressed) {
    actions.add('SECONDARY');
  }
  if (state.buttons.west.pressed) {
    actions.add('TERTIARY');
  }
  if (state.buttons.north.pressed) {
    actions.add('QUATERNARY');
  }

  if (state.buttons.leftShoulder.pressed) {
    actions.add('LEFT_SHOULDER');
  }
  if (state.buttons.rightShoulder.pressed) {
    actions.add('RIGHT_SHOULDER');
  }

  if (state.triggers.left >= config.triggerThreshold) {
    actions.add('LEFT_TRIGGER');
  }
  if (state.triggers.right >= config.triggerThreshold) {
    actions.add('RIGHT_TRIGGER');
  }

  if (state.buttons.select.pressed) {
    actions.add('SELECT');
  }
  if (state.buttons.start.pressed) {
    actions.add('START');
  }
  if (state.buttons.home.pressed) {
    actions.add('HOME');
  }

  if (state.buttons.leftStick.pressed) {
    actions.add('LEFT_STICK');
  }
  if (state.buttons.rightStick.pressed) {
    actions.add('RIGHT_STICK');
  }

  return actions;
}
