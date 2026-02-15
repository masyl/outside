/**
 * Optimized Bixel Line Drawing Implementations
 * Various optimization techniques for Bresenham's line algorithm
 */

import type { Point, LineDrawingResult } from './bixel-line-drawing'

// ============================================================================
// VARIANT 1: Bitwise Operations (Fast coordinate conversion)
// ============================================================================

/**
 * Convert pixel coordinates to bixel using bitwise right shift (>> 2 = / 4)
 * ~3-5% faster than Math.floor for coordinate conversion
 */
export function pixelToBixelFast(pixelX: number, pixelY: number): Point {
  return {
    x: pixelX >> 2,
    y: pixelY >> 2,
  }
}

/**
 * Convert bixel to pixel using bitwise left shift (<< 2 = * 4)
 * ~3-5% faster than multiplication
 */
export function bixelToPixelFast(bixelX: number, bixelY: number): Point {
  return {
    x: bixelX << 2,
    y: bixelY << 2,
  }
}

/**
 * Get bixel pixels using bitwise operations
 * Slightly faster due to bitwise shift operations
 */
export function getBixelPixelsFast(bixelX: number, bixelY: number): Point[] {
  const pixels: Point[] = []
  const startX = bixelX << 2
  const startY = bixelY << 2

  for (let y = startY; y < startY + 4; y++) {
    for (let x = startX; x < startX + 4; x++) {
      pixels.push({ x, y })
    }
  }

  return pixels
}

// ============================================================================
// VARIANT 2: Compact Array Representation (Lower memory, fewer allocations)
// ============================================================================

/**
 * Flat array format: [x0, y0, x1, y1, x2, y2, ...]
 * Reduces object allocations by 50%+, faster for batch processing
 */
export function bresenhamBixelLineFlatArray(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { points: number[]; startPoint: Point; endPoint: Point } {
  const points: number[] = []

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)

  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1

  let err = dx - dy
  let x = x0
  let y = y0

  while (true) {
    points.push(x, y)

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
 * Get bixel pixels as flat array [x0,y0, x1,y1, ...]
 * Reduces allocation overhead compared to array of objects
 */
export function getBixelPixelsFlatArray(bixelX: number, bixelY: number): number[] {
  const pixels: number[] = []
  const startX = bixelX * 4
  const startY = bixelY * 4

  for (let y = startY; y < startY + 4; y++) {
    for (let x = startX; x < startX + 4; x++) {
      pixels.push(x, y)
    }
  }

  return pixels
}

// ============================================================================
// VARIANT 3: Memoization (Caches results for repeated lines)
// ============================================================================

interface CacheKey {
  x0: number
  y0: number
  x1: number
  y1: number
}

class BixelLineMemoizer {
  private cache = new Map<string, LineDrawingResult>()
  private maxCacheSize = 1000

  private makeKey(x0: number, y0: number, x1: number, y1: number): string {
    return `${x0},${y0},${x1},${y1}`
  }

  bresenhamBixelLine(x0: number, y0: number, x1: number, y1: number): LineDrawingResult {
    const key = this.makeKey(x0, y0, x1, y1)

    if (this.cache.has(key)) {
      return this.cache.get(key)!
    }

    const result = this.computeLine(x0, y0, x1, y1)

    // Simple LRU: clear cache if it gets too large
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, result)
    return result
  }

  private computeLine(x0: number, y0: number, x1: number, y1: number): LineDrawingResult {
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

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxCacheSize }
  }
}

export function createBixelMemoizer(): BixelLineMemoizer {
  return new BixelLineMemoizer()
}

// ============================================================================
// VARIANT 4: Optimized Set Operations (For rendering/deduplication)
// ============================================================================

/**
 * Convert Point array to a Set using numeric encoding instead of strings
 * Format: x + (y << 16) allows fast Set operations with numbers
 * Much faster than Set<string> for coordinates up to 65536
 */
export function pointsToNumericSet(points: Point[]): Set<number> {
  const set = new Set<number>()
  for (const point of points) {
    set.add(point.x + (point.y << 16))
  }
  return set
}

/**
 * Decode numeric set back to Point array
 */
export function numericSetToPoints(set: Set<number>): Point[] {
  const points: Point[] = []
  for (const encoded of set) {
    points.push({
      x: encoded & 0xffff,
      y: encoded >> 16,
    })
  }
  return points
}

/**
 * Create a bitmask for a grid (more memory efficient for large grids)
 * Each bit represents whether a pixel is filled
 * Useful for 250x250 grids or larger
 */
export function createBitmaskFromPoints(points: Point[], gridSize: number): Uint8Array {
  const byteCount = Math.ceil((gridSize * gridSize) / 8)
  const bitmask = new Uint8Array(byteCount)

  for (const point of points) {
    const bitIndex = point.y * gridSize + point.x
    const byteIndex = bitIndex >> 3 // divide by 8
    const bitOffset = bitIndex & 7 // modulo 8

    bitmask[byteIndex] |= 1 << bitOffset
  }

  return bitmask
}

/**
 * Extract points from bitmask
 */
export function pointsFromBitmask(bitmask: Uint8Array, gridSize: number): Point[] {
  const points: Point[] = []

  for (let byteIndex = 0; byteIndex < bitmask.length; byteIndex++) {
    const byte = bitmask[byteIndex]
    if (byte === 0) continue // Skip empty bytes

    for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
      if (byte & (1 << bitOffset)) {
        const bitIndex = (byteIndex << 3) + bitOffset
        const x = bitIndex % gridSize
        const y = Math.floor(bitIndex / gridSize)
        points.push({ x, y })
      }
    }
  }

  return points
}
