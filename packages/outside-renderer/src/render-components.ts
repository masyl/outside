/**
 * Runtime-only facing cache for renderer animation.
 */
export const RenderFacing = {
  dir: [] as number[],
};

/**
 * Runtime-only accumulated moving time in milliseconds, used to derive walk frame index.
 */
export const RenderWalkDistance = {
  value: [] as number[],
};

/**
 * Runtime-only walk frame index.
 */
export const RenderWalkFrame = {
  index: [] as number[],
};

/**
 * Runtime-only previous position snapshot.
 */
export const RenderLastPosition = {
  x: [] as number[],
  y: [] as number[],
};

/**
 * Runtime-only movement flag (0/1) used for frame selection.
 */
export const RenderIsMoving = {
  value: [] as number[],
};
