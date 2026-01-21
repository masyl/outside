/**
 * Zoom state management with browser persistence
 * Provides discrete zoom levels with wrap-around cycling
 */

import { setCurrentZoomScale } from './zoomScaleService';

export interface ZoomState {
  level: number; // 2, 4, 6, 8 (zoom level)
  scale: number; // 0.5, 1.0, 1.5, 2.0 (pixel multiplier)
}

export class ZoomManager {
  private level: 2 | 4 | 6 | 8 = 4; // Default zoom level 4 (1.0x scale)
  private readonly ZOOM_LEVELS = [2, 4, 6, 8] as const;
  private readonly ZOOM_SCALES = [0.5, 1.0, 1.5, 2.0] as const;
  private readonly STORAGE_KEY = 'outside-zoom-level';

  /**
   * Get current zoom state
   */
  getState(): ZoomState {
    return {
      level: this.level,
      scale: this.ZOOM_SCALES[this.ZOOM_LEVELS.indexOf(this.level)],
    };
  }

  /**
   * Set zoom level
   */
  setLevel(level: 2 | 4 | 6 | 8): void {
    this.level = level;
    const scale = this.ZOOM_SCALES[this.ZOOM_LEVELS.indexOf(this.level)];
    setCurrentZoomScale(scale);
    this.saveToBrowser();
  }

  /**
   * Increase zoom level (wrap around from 8 to 2)
   */
  increaseZoom(): void {
    const currentIndex = this.ZOOM_LEVELS.indexOf(this.level);
    const nextIndex = (currentIndex + 1) % this.ZOOM_LEVELS.length;
    this.setLevel(this.ZOOM_LEVELS[nextIndex]);
  }

  /**
   * Decrease zoom level (wrap around from 2 to 8)
   */
  decreaseZoom(): void {
    const currentIndex = this.ZOOM_LEVELS.indexOf(this.level);
    const prevIndex = (currentIndex - 1 + this.ZOOM_LEVELS.length) % this.ZOOM_LEVELS.length;
    this.setLevel(this.ZOOM_LEVELS[prevIndex]);
  }

  /**
   * Load zoom level from browser storage
   */
  loadFromBrowser(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const level = parseInt(stored, 10);
        if (this.ZOOM_LEVELS.includes(level as 2 | 4 | 6 | 8)) {
          this.level = level as 2 | 4 | 6 | 8;
        }
      }
    } catch (error) {
      console.warn('Failed to load zoom level from browser:', error);
    }
  }

  /**
   * Save zoom level to browser storage
   */
  private saveToBrowser(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.level.toString());
    } catch (error) {
      console.warn('Failed to save zoom level to browser:', error);
    }
  }

  /**
   * Initialize zoom manager with browser persistence
   */
  constructor() {
    this.loadFromBrowser();
    // Initialize the zoom scale service with current scale
    const scale = this.ZOOM_SCALES[this.ZOOM_LEVELS.indexOf(this.level)];
    setCurrentZoomScale(scale);
  }
}

/**
 * Global zoom manager instance
 */
export const zoomManager = new ZoomManager();
