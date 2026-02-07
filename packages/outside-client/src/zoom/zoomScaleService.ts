/**
 * Zoom service - provides zoom scale without circular dependencies
 * This is a simple service that coordinates between zoom state and coordinate system
 */

let currentZoomScale = 1.0; // Default zoom scale

export interface ZoomScaleProvider {
  getZoomScale(): number;
  setZoomScale(scale: number): void;
}

/**
 * Set the current zoom scale (called by ZoomManager)
 */
export function setCurrentZoomScale(scale: number): void {
  currentZoomScale = scale;
}

/**
 * Get the current zoom scale (called by coordinate system)
 */
export function getCurrentZoomScale(): number {
  return currentZoomScale;
}

/**
 * Get the current zoom scale (convenience function for components)
 */
export function getZoomScale(): number {
  return getCurrentZoomScale();
}

/**
 * Global zoom scale provider
 */
export const zoomScaleProvider: ZoomScaleProvider = {
  getZoomScale: getCurrentZoomScale,
  setZoomScale: setCurrentZoomScale,
};
