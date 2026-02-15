/**
 * Bixel Line Drawing Library
 * Reference implementation of Bresenham's line algorithm for Bixel coordinates
 */

export interface Point {
  x: number
  y: number
}

export interface LineDrawingResult {
  points: Point[]
  startPoint: Point
  endPoint: Point
}

/**
 * Classic Bresenham's line algorithm - pixel based
 * @param x0 Start X coordinate
 * @param y0 Start Y coordinate
 * @param x1 End X coordinate
 * @param y1 End Y coordinate
 * @returns Array of points representing the line
 */
export function bresenhamPixelLine(x0: number, y0: number, x1: number, y1: number): LineDrawingResult {
  const points: Point[] = []

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)

  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1

  let err = dx - dy
  let x = x0
  let y = y0

  while (true) {
    points.push({ x, y })

    if (x === x1 && y === y1) break

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      x += sx
    }

    if (e2 < dx) {
      err += dx
      y += sy
    }
  }

  return {
    points,
    startPoint: { x: x0, y: y0 },
    endPoint: { x: x1, y: y1 },
  }
}

/**
 * Bixel Bresenham's line algorithm - operates on 4bx bixel units
 * @param x0 Start X coordinate (in bixel units)
 * @param y0 Start Y coordinate (in bixel units)
 * @param x1 End X coordinate (in bixel units)
 * @param y1 End Y coordinate (in bixel units)
 * @returns Array of bixel positions representing the line
 */
export function bresenhamBixelLine(x0: number, y0: number, x1: number, y1: number): LineDrawingResult {
  const points: Point[] = []

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)

  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1

  let err = dx - dy
  let x = x0
  let y = y0

  while (true) {
    points.push({ x, y })

    if (x === x1 && y === y1) break

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      x += sx
    }

    if (e2 < dx) {
      err += dx
      y += sy
    }
  }

  return {
    points,
    startPoint: { x: x0, y: y0 },
    endPoint: { x: x1, y: y1 },
  }
}

/**
 * Convert pixel coordinates to bixel coordinates (4bx = 4x4)
 * @param pixelX Pixel X coordinate
 * @param pixelY Pixel Y coordinate
 * @returns Bixel coordinate
 */
export function pixelToBixel(pixelX: number, pixelY: number): Point {
  return {
    x: Math.floor(pixelX / 4),
    y: Math.floor(pixelY / 4),
  }
}

/**
 * Convert bixel coordinates to pixel coordinates (4bx = 4x4)
 * @param bixelX Bixel X coordinate
 * @param bixelY Bixel Y coordinate
 * @returns Pixel coordinate (top-left of bixel)
 */
export function bixelToPixel(bixelX: number, bixelY: number): Point {
  return {
    x: bixelX * 4,
    y: bixelY * 4,
  }
}

/**
 * Get all pixels that should be filled for a bixel
 * @param bixelX Bixel X coordinate
 * @param bixelY Bixel Y coordinate
 * @returns Array of pixel coordinates that make up this bixel
 */
export function getBixelPixels(bixelX: number, bixelY: number): Point[] {
  const pixels: Point[] = []
  const startX = bixelX * 4
  const startY = bixelY * 4

  for (let y = startY; y < startY + 4; y++) {
    for (let x = startX; x < startX + 4; x++) {
      pixels.push({ x, y })
    }
  }

  return pixels
}

/**
 * Predefined line angles for demo
 */
export const DEMO_LINES = [
  { name: 'Horizontal', start: { x: 2, y: 8 }, end: { x: 14, y: 8 } },
  { name: '45° Diagonal', start: { x: 2, y: 2 }, end: { x: 14, y: 14 } },
  { name: '30° Angle', start: { x: 2, y: 14 }, end: { x: 14, y: 6 } },
  { name: 'Vertical', start: { x: 8, y: 2 }, end: { x: 8, y: 14 } },
  { name: '-30° Angle', start: { x: 2, y: 6 }, end: { x: 14, y: 14 } },
  { name: 'Shallow Diagonal', start: { x: 2, y: 10 }, end: { x: 14, y: 12 } },
]
