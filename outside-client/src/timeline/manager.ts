import { Store } from '../store/store';
import { EventLogger } from '../store/persistence';
import { TimelineEvent, TimelineConfig, PlaybackState, TimelineManagerState } from './types';
import { reducer as storeReducer } from '../store/reducers';
import { createWorldState } from '@outside/core';

export class TimelineManager {
  private store: Store;
  private eventLogger: EventLogger;
  private config: TimelineConfig;
  private endStateCache: any = null;
  private pointer: number = 0;
  private playbackState: PlaybackState = PlaybackState.PLAYING;
  private stateChangeCallbacks: ((state: PlaybackState) => void)[] = [];

  constructor(store: Store, eventLogger: EventLogger, config?: Partial<TimelineConfig>) {
    this.store = store;
    this.eventLogger = eventLogger;
    this.config = {
      maxEvents: config?.maxEvents || 10000,
      collapseThreshold: config?.collapseThreshold || 480,
    };
  }

  getState(): TimelineManagerState {
    try {
      const events = this.eventLogger.loadEvents();
      return {
        currentStep: this.pointer,
        mode: this.playbackState === PlaybackState.PLAYING ? 'normal' : 'timeline',
        totalSteps: events.length,
      };
    } catch (e) {
      console.error('Error loading events for state:', e);
      return {
        currentStep: this.pointer,
        mode: 'normal',
        totalSteps: 0,
      };
    }
  }

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  getCurrentStep(): number {
    return this.pointer;
  }

  onStateChange(callback: (state: PlaybackState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach((callback) => callback(this.playbackState));
  }

  private notifyPositionChange(): void {
    const events = this.eventLogger.loadEvents();
    this.stateChangeCallbacks.forEach((callback) => {
      if ('onPositionChange' in callback) {
        (callback as any).onPositionChange(this.pointer, events.length);
      }
    });
  }

  goToStep(stepNumber: number): void {
    try {
      const events = this.eventLogger.loadEvents();
      if (events.length === 0) {
        this.pointer = 0;
        return;
      }

      // Clamp step number
      const targetStep = Math.max(0, Math.min(stepNumber, events.length - 1));

      if (!this.endStateCache) {
        this.endStateCache = this.store.getState();
      }

      this.pointer = targetStep;
      this.setPlaybackState(PlaybackState.TRAVELING);

      const stateAtStep = this.reconstructState(targetStep);
      this.store.dispatch({ type: 'SET_WORLD_STATE', payload: { worldState: stateAtStep } });

      this.notifyPositionChange();
    } catch (e) {
      console.error('Error in goToStep:', e);
    }
  }

  stepForward(): void {
    this.goToStep(this.pointer + 1);
  }

  stepBackward(): void {
    this.goToStep(this.pointer - 1);
  }

  goToStart(): void {
    this.goToStep(0);
  }

  goToEnd(): void {
    const events = this.eventLogger.loadEvents();
    this.goToStep(events.length - 1);
  }

  private reconstructState(targetStep: number): any {
    try {
      const events = this.eventLogger.loadEvents();
      let state = this.getInitialState();

      for (let i = 0; i <= targetStep; i++) {
        const event = events[i];
        if (!event || !event.action) continue;

        if ((event.step ?? i) > targetStep) continue;

        try {
          state = this.reducer(state, event.action);
        } catch (e) {
          console.error('Error applying action during reconstruction:', e);
        }
      }

      return state;
    } catch (e) {
      console.error('Error reconstructing state:', e);
      return this.getInitialState();
    }
  }

  private getInitialState(): any {
    return createWorldState();
  }

  private reducer(state: any, action: any): any {
    return storeReducer(state, action);
  }

  truncateHistory(currentStep: number): void {
    const events = this.eventLogger.loadEvents();
    const eventsToKeep = events.slice(0, currentStep + 1);
    this.eventLogger.setEvents(eventsToKeep);
  }

  enforceLimit(): void {
    const events = this.eventLogger.loadEvents();
    if (events.length > this.config.maxEvents) {
      const eventsToCollapse = events.slice(0, this.config.collapseThreshold);
      const collapsedState = this.reconstructState(this.config.collapseThreshold - 1);

      const collapsedEvent: { action: any; timestamp: number; step: number } = {
        action: { type: 'SET_WORLD_STATE', payload: { worldState: collapsedState } },
        timestamp: eventsToCollapse[0].timestamp,
        step: 0,
      };

      const remainingEvents = events.slice(this.config.collapseThreshold);
      this.eventLogger.setEvents([collapsedEvent, ...remainingEvents]);
    }
  }

  restoreEndState(): void {
    if (this.endStateCache) {
      this.store.dispatch({ type: 'SET_WORLD_STATE', payload: { worldState: this.endStateCache } });
      this.endStateCache = null;
      this.setPlaybackState(PlaybackState.PLAYING);
    }
  }

  setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.notifyStateChange();
  }
}
