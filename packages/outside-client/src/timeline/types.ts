import { Action } from '../store/actions';

export interface TimelineEvent {
  action: Action;
  timestamp: number;
  step: number;
  originalValue?: any;
  tag?: string; // Optional tag/marker (e.g., "LevelStart")
}

export interface TimelineConfig {
  maxEvents: number;
  collapseThreshold: number;
}

export interface TimelineManagerState {
  currentStep: number;
  mode: 'normal' | 'timeline';
  totalSteps: number;
}

export enum PlaybackState {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  TRAVELING = 'TRAVELING',
}
