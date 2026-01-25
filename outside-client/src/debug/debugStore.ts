import { Store } from '../store/store';
import { useSyncExternalStore } from 'react';

// Define the shape of debug data
export interface DebugState {
  fps: number;
  rafFps: number;
  tickerFps: number;
  tickerMaxFps: number;
  tickerMinFps: number;
  step: number;
  mode: string;
  rendererMode: 'legacy' | 'unified' | 'dual' | 'unknown';
  surfaceCount: number;
  groundCount: number;
  eventCount: number;
  clientCount: number;
  p2pStatus: string;
  playbackMode: string;
  timelineCursor: number;
  timelineTotal: number;
  zoomLevel: number;
  zoomScale: number;
  visible: boolean;
}

// Initial default state
const INITIAL_STATE: DebugState = {
  fps: 0,
  rafFps: 0,
  tickerFps: 0,
  tickerMaxFps: 0,
  tickerMinFps: 0,
  step: 0,
  mode: 'unknown',
  rendererMode: 'unknown',
  surfaceCount: 0,
  groundCount: 0,
  eventCount: 0,
  clientCount: 0,
  p2pStatus: 'unknown',
  playbackMode: 'unknown',
  timelineCursor: 0,
  timelineTotal: 0,
  zoomLevel: 4,
  zoomScale: 1.0,
  visible: true, // Default to visible
};

// Singleton store for debug data (separate from main game store to avoid frequent re-renders of game components)
class DebugStore {
  private state: DebugState = { ...INITIAL_STATE };
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Restore visibility from local storage
    const storedVisibility = window.localStorage.getItem('outside.debugOverlay.visible');
    if (storedVisibility === 'hidden') {
      this.state.visible = false;
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Update methods
  update(partial: Partial<DebugState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  toggleVisibility() {
    const newVisible = !this.state.visible;
    this.state.visible = newVisible;
    window.localStorage.setItem('outside.debugOverlay.visible', newVisible ? 'visible' : 'hidden');
    this.notify();
  }
}

export const debugStore = new DebugStore();

// React hook to access debug state
export function useDebugState(): DebugState {
  return useSyncExternalStore(
    (callback) => debugStore.subscribe(callback),
    () => debugStore.getState()
  );
}
