import { useSyncExternalStore } from 'react';

interface KeystrokeState {
  visible: boolean;
}

class KeystrokeStore {
  private state: KeystrokeState = { visible: false };
  private listeners: Set<() => void> = new Set();

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

  setVisible(visible: boolean) {
    if (this.state.visible !== visible) {
      this.state = { ...this.state, visible };
      this.notify();
    }
  }

  toggle() {
    this.setVisible(!this.state.visible);
  }
}

export const keystrokeStore = new KeystrokeStore();

export function useKeystrokeState() {
  return useSyncExternalStore(
    (callback) => keystrokeStore.subscribe(callback),
    () => keystrokeStore.getState()
  );
}
