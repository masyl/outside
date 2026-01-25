/**
 * Zoom state management with browser persistence
 * Provides discrete zoom levels with wrap-around cycling
 */

import { setCurrentZoomScale } from './zoomScaleService';

export interface ZoomState {
  level: number; // (zoom level)
  scale: number; // (pixel multiplier)
}

export class ZoomManager {
  private level: 1 | 2 | 3 | 4 | 5 = 3; // Default zoom level 4 (1.0x scale)
  private readonly ZOOM_LEVELS = [1, 2, 3, 4, 5] as const;
  private readonly ZOOM_SCALES = [0.25, 0.5, 0.75, 1, 1.5] as const;
  private readonly STORAGE_KEY = 'outside-zoom-level';
  private zoomChangeListeners: Array<(level: number, scale: number) => void> = [];

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
   * Get current zoom level
   */
  getLevel(): number {
    return this.level;
  }

  /**
   * Get current zoom scale
   */
  getScale(): number {
    return this.ZOOM_SCALES[this.ZOOM_LEVELS.indexOf(this.level)];
  }

  /**
   * Set zoom level
   */
  setLevel(level: 1 | 2 | 3 | 4 | 5): void {
    this.level = level;
    const scale = this.ZOOM_SCALES[this.ZOOM_LEVELS.indexOf(this.level)];
    setCurrentZoomScale(scale);
    this.saveToBrowser();
    this.notifyZoomChangeListeners();
  }

  /**
   * Add a listener for zoom changes
   */
  addZoomChangeListener(callback: (level: number, scale: number) => void): void {
    this.zoomChangeListeners.push(callback);
  }

  /**
   * Remove a zoom change listener
   */
  removeZoomChangeListener(callback: (level: number, scale: number) => void): void {
    const index = this.zoomChangeListeners.indexOf(callback);
    if (index > -1) {
      this.zoomChangeListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of zoom change
   */
  private notifyZoomChangeListeners(): void {
    const scale = this.ZOOM_SCALES[this.ZOOM_LEVELS.indexOf(this.level)];
    this.zoomChangeListeners.forEach((callback) => callback(this.level, scale));
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
        if (this.ZOOM_LEVELS.includes(level as 1 | 2 | 3 | 4 | 5)) {
          this.level = level as 1 | 2 | 3 | 4 | 5;
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
