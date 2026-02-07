import { debugStore } from './debugStore';

export class DebugBridge {
  static setStepCount(count: number): void {
    debugStore.update({ step: count });
  }

  static setMode(mode: string): void {
    debugStore.update({ mode: mode });
  }

  static setRendererMode(mode: 'legacy' | 'unified' | 'dual'): void {
    debugStore.update({ rendererMode: mode });
  }

  static setObjectCounts(surface: number, ground: number): void {
    debugStore.update({ surfaceCount: surface, groundCount: ground });
  }

  static setClientCount(count: number): void {
    debugStore.update({ clientCount: count });
  }

  static setEventCount(count: number): void {
    debugStore.update({ eventCount: count });
  }

  static setP2pStatus(status: string): void {
    debugStore.update({ p2pStatus: status });
  }

  static setPlaybackMode(mode: string): void {
    debugStore.update({ playbackMode: mode });
  }

  static setTimelineCursor(current: number, total: number): void {
    debugStore.update({ timelineCursor: current, timelineTotal: total });
  }

  static setZoomLevel(level: number, scale: number): void {
    debugStore.update({ zoomLevel: level, zoomScale: scale });
  }

  static getStepCount(): number {
    return debugStore.getState().step;
  }

  static isVisible(): boolean {
    return debugStore.getState().visible;
  }

  static toggle(): void {
    debugStore.toggleVisibility();
  }

  static onVisibilityChange(callback: (visible: boolean) => void): void {
    let lastVisible = debugStore.getState().visible;

    // Call immediately with current state
    callback(lastVisible);

    debugStore.subscribe(() => {
      const currentVisible = debugStore.getState().visible;
      // Only invoke callback if visibility value changed
      if (currentVisible !== lastVisible) {
        lastVisible = currentVisible;
        callback(currentVisible);
      }
    });
  }
}
