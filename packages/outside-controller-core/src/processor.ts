import { resolveActiveActions } from './actions';
import { DEFAULT_CONTROLLER_CORE_CONFIG } from './defaults';
import { normalizeControllerSnapshot } from './normalize';
import {
  CONTROLLER_ACTION_ORDER,
  ControllerActionEvent,
  ControllerActionName,
  ControllerCoreConfig,
  ControllerFrameResult,
  RawControllerSnapshot,
} from './types';

export type ControllerCoreConfigInput = Partial<Omit<ControllerCoreConfig, 'repeatableActions'>> & {
  repeatableActions?: readonly ControllerActionName[];
};

export function createControllerCoreConfig(
  input: ControllerCoreConfigInput = {}
): ControllerCoreConfig {
  return {
    deadzone: input.deadzone ?? DEFAULT_CONTROLLER_CORE_CONFIG.deadzone,
    triggerThreshold: input.triggerThreshold ?? DEFAULT_CONTROLLER_CORE_CONFIG.triggerThreshold,
    buttonPressThreshold:
      input.buttonPressThreshold ?? DEFAULT_CONTROLLER_CORE_CONFIG.buttonPressThreshold,
    directionThreshold:
      input.directionThreshold ?? DEFAULT_CONTROLLER_CORE_CONFIG.directionThreshold,
    repeatInitialDelayMs:
      input.repeatInitialDelayMs ?? DEFAULT_CONTROLLER_CORE_CONFIG.repeatInitialDelayMs,
    repeatIntervalMs: input.repeatIntervalMs ?? DEFAULT_CONTROLLER_CORE_CONFIG.repeatIntervalMs,
    repeatableActions: input.repeatableActions ?? DEFAULT_CONTROLLER_CORE_CONFIG.repeatableActions,
  };
}

function resolveFrameTime(
  snapshot: RawControllerSnapshot,
  explicitFrameTimeMs: number | undefined,
  lastFrameTimeMs: number
): number {
  if (Number.isFinite(explicitFrameTimeMs)) {
    return explicitFrameTimeMs as number;
  }

  if (Number.isFinite(snapshot.timestamp)) {
    return snapshot.timestamp as number;
  }

  return lastFrameTimeMs + 16;
}

export class ControllerInputProcessor {
  private config: ControllerCoreConfig;
  private activeActions: Set<ControllerActionName> = new Set();
  private nextRepeatAtByAction: Map<ControllerActionName, number> = new Map();
  private lastFrameTimeMs = 0;

  constructor(inputConfig: ControllerCoreConfigInput = {}) {
    this.config = createControllerCoreConfig(inputConfig);
  }

  configure(inputConfig: ControllerCoreConfigInput): void {
    this.config = createControllerCoreConfig({
      ...this.config,
      ...inputConfig,
    });
  }

  reset(): void {
    this.activeActions.clear();
    this.nextRepeatAtByAction.clear();
    this.lastFrameTimeMs = 0;
  }

  process(snapshot: RawControllerSnapshot, frameTimeMs?: number): ControllerFrameResult {
    const atMs = resolveFrameTime(snapshot, frameTimeMs, this.lastFrameTimeMs);
    const normalized = normalizeControllerSnapshot(snapshot, this.config);
    const nextActiveActions = resolveActiveActions(normalized, this.config);
    const events: ControllerActionEvent[] = [];

    for (let i = 0; i < CONTROLLER_ACTION_ORDER.length; i++) {
      const action = CONTROLLER_ACTION_ORDER[i];
      const isActive = nextActiveActions.has(action);
      const wasActive = this.activeActions.has(action);

      if (isActive && !wasActive) {
        events.push({ action, phase: 'pressed', atMs });
        if (this.isRepeatable(action)) {
          this.nextRepeatAtByAction.set(action, atMs + this.config.repeatInitialDelayMs);
        }
        continue;
      }

      if (!isActive && wasActive) {
        events.push({ action, phase: 'released', atMs });
        this.nextRepeatAtByAction.delete(action);
        continue;
      }

      if (!isActive || !wasActive || !this.isRepeatable(action)) {
        continue;
      }

      const nextRepeatAt = this.nextRepeatAtByAction.get(action);
      if (nextRepeatAt == null) {
        this.nextRepeatAtByAction.set(action, atMs + this.config.repeatIntervalMs);
        continue;
      }

      if (atMs >= nextRepeatAt) {
        events.push({ action, phase: 'repeat', atMs });
        this.nextRepeatAtByAction.set(action, atMs + this.config.repeatIntervalMs);
      }
    }

    this.activeActions = nextActiveActions;
    this.lastFrameTimeMs = atMs;

    return {
      atMs,
      profile: normalized.profile,
      normalized,
      actions: events,
    };
  }

  private isRepeatable(action: ControllerActionName): boolean {
    return this.config.repeatableActions.includes(action);
  }
}
