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
      const currentX = fromPixelX + (toPixelX - fromPixelX) * progress;
      const currentY = fromPixelY + (toPixelY - fromPixelY) * progress;
      
      if (onUpdate) {
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
