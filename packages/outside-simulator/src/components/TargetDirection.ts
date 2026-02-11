/**
 * Desired movement direction intent for player/controller input.
 * x/y are normalized vector components; magnitude is clamped to [0..1].
 */
const TargetDirection = {
  x: [] as number[],
  y: [] as number[],
  magnitude: [] as number[],
};
export default TargetDirection;
