import { CoordinateConverter } from './coordinateSystem';

export type ViewportOffsetInput = {
  cameraPos: { x: number; y: number };
  screen: { width: number; height: number };
  zoomScale: number;
};

/**
 * Compute the `rootContainer` offset so that the camera position is centered on screen.
 *
 * Note: `cameraPos` is in grid units (can be fractional), `rootContainer` is in pixels.
 */
export function computeViewportOffset(input: ViewportOffsetInput): { x: number; y: number } {
  const centerPos = CoordinateConverter.gridToDisplay(
    { x: input.cameraPos.x, y: input.cameraPos.y },
    input.zoomScale
  );

  return {
    x: input.screen.width / 2 - centerPos.x,
    y: input.screen.height / 2 - centerPos.y,
  };
}

