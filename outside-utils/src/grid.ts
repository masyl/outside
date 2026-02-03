/**
 * Grid snap utilities. Resolution is relative to the integer coordinate system:
 * resolution 1 = integer cells; 0.125 = 8 discrete positions per 1 unit.
 *
 * @packageDocumentation
 */

/**
 * Snaps real coordinates to the nearest grid cell.
 *
 * @param x - World x
 * @param y - World y
 * @param resolution - Grid resolution (world units per cell; e.g. 1 or 0.125)
 * @returns Snapped { x, y }
 */
export function snapToGrid(
  x: number,
  y: number,
  resolution: number
): { x: number; y: number } {
  const inv = 1 / resolution;
  const xSnap = Math.round(x * inv) / inv;
  const ySnap = Math.round(y * inv) / inv;
  return {
    x: xSnap === 0 ? 0 : xSnap,
    y: ySnap === 0 ? 0 : ySnap,
  };
}
