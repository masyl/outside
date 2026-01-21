import { GameObject } from '@outside/core';
import { CoordinateConverter, getZoomScale } from '../renderer/coordinateSystem';

/**
 * Cubic ease-in-out function
 * Equivalent to CSS cubic-bezier(0.4, 0, 0.2, 1)
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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
  duration: number = 125,
  onUpdate?: (x: number, y: number) => void,
  onComplete?: () => void
): () => void {
  // Convert grid coordinates to pixel coordinates
  const zoomScale = getZoomScale();
  const fromDisplay = CoordinateConverter.gridToDisplay({ x: fromX, y: fromY }, zoomScale);
  const toDisplay = CoordinateConverter.gridToDisplay({ x: toX, y: toY }, zoomScale);

  const fromPixelX = fromDisplay.x;
  const fromPixelY = fromDisplay.y;
  const toPixelX = toDisplay.x;
  const toPixelY = toDisplay.y;

  // console.log(`[animateObjectMovement] Starting animation for ${objectId}:`);
  // console.log(`  From pixel: (${fromPixelX}, ${fromPixelY})`);
  // console.log(`  To pixel: (${toPixelX}, ${toPixelY})`);
  // console.log(`  Duration: ${duration}ms`);

  // Use requestAnimationFrame for smooth animation with motion.dev easing
  const startTime = performance.now();
  let animationFrameId: number | null = null;
  let cancelled = false;

  const animate = (currentTime: number) => {
    if (cancelled) {
      return;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Apply easing (cubic ease-in-out: [0.4, 0, 0.2, 1])
    const easedProgress = easeInOutCubic(progress);

    // Interpolate between start and end pixel positions
    const currentX = fromPixelX + (toPixelX - fromPixelX) * easedProgress;
    const currentY = fromPixelY + (toPixelY - fromPixelY) * easedProgress;

    if (onUpdate) {
      // Callback receives pixel coordinates, allowing sub-grid positioning
      onUpdate(currentX, currentY);
    }

    if (progress < 1) {
      // Continue animation
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Animation complete
      // console.log(`[animateObjectMovement] Animation completed for ${objectId}`);
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Start animation
  animationFrameId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    // console.log(`[animateObjectMovement] Cancelling animation for ${objectId}`);
    cancelled = true;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };
}
