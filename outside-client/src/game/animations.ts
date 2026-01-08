import { animate } from 'motion';
import { GameObject } from '@outside/core';
import { DISPLAY_TILE_SIZE } from '../renderer/grid';

/**
 * Animation state for objects
 */
export interface AnimationState {
  [objectId: string]: {
    x: number;
    y: number;
    isAnimating: boolean;
  };
}

/**
 * Animate an object moving from one position to another
 * @param fromX - Starting X position in GRID coordinates
 * @param fromY - Starting Y position in GRID coordinates
 * @param toX - Target X position in GRID coordinates
 * @param toY - Target Y position in GRID coordinates
 * @param duration - Animation duration in milliseconds
 * @param onUpdate - Callback with pixel coordinates (x, y) for each frame
 * @param onComplete - Callback when animation completes
 * @returns Cancel function
 */
export function animateObjectMovement(
  objectId: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  duration: number = 500,
  onUpdate?: (x: number, y: number) => void,
  onComplete?: () => void
): () => void {
  // Convert grid coordinates to pixel coordinates
  const fromPixelX = fromX * DISPLAY_TILE_SIZE;
  const fromPixelY = fromY * DISPLAY_TILE_SIZE;
  const toPixelX = toX * DISPLAY_TILE_SIZE;
  const toPixelY = toY * DISPLAY_TILE_SIZE;

  const animation = animate(
    (progress) => {
      // Interpolate between start and end pixel positions
      // This allows smooth intermediate positions between grid tiles
      const currentX = fromPixelX + (toPixelX - fromPixelX) * progress;
      const currentY = fromPixelY + (toPixelY - fromPixelY) * progress;
      
      if (onUpdate) {
        // Callback receives pixel coordinates, allowing sub-grid positioning
        onUpdate(currentX, currentY);
      }
    },
    {
      duration: duration,
      easing: [0.4, 0, 0.2, 1], // Ease-in-out cubic
    }
  );

  animation.then(() => {
    if (onComplete) {
      onComplete();
    }
  });

  // Return cancel function
  return () => {
    animation.cancel();
  };
}
