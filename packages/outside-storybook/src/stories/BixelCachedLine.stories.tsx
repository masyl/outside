import React, { useState, useMemo } from 'react'
import {
  bresenhamBixelLine,
  bresenhamPixelLine,
  createBixelMemoizer,
  type Point,
} from '@outside/bixel'
import type { Meta, StoryObj } from '@storybook/react'
import { BixelCachedLineDrawingInteractive } from '@outside/bixel'
import './BixelCachedLine.css'

const meta = {
  title: 'Graphics/Bixel Cached Drawing',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Interactive bixel line drawing with multi-level caching.

**Features:**
- Draw lines by clicking two tiles on a 16×16 grid
- Drag endpoints to modify lines
- Cache lines by normalized direction vector (encodes length + angle)
- Switch between 5 coarseness levels: 1x (pixel), 2x, 4x, 8x, 16x (tile)
- Track cache hit/miss statistics in real-time
- Coarser levels = faster computation but blockier rendering

**Caching Strategy:**
Lines are cached by their normalized bixel delta at each scale.
Two lines with the same direction and distance will produce identical pixel patterns
(just translated), so they hit the cache immediately.

**Use Case:**
Demonstrates how algorithmic caching can speed up repeated line draws in games or editors,
and how coarseness affects performance vs visual quality.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BixelCachedLineDrawingInteractive>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive canvas with multi-level caching at default 4x coarseness
 */
export const Default: Story = {
  render: () => <BixelCachedLineDrawingInteractive />,
}

/**
 * Explore caching effectiveness by drawing parallel lines and switching coarseness levels
 */
export const InteractiveCaching: Story = {
  render: () => <BixelCachedLineDrawingInteractive />,
  parameters: {
    docs: {
      description: {
        story:
          'Draw several parallel lines (same angle, different positions) to see cache hits accumulate. Then drag endpoints and switch coarseness levels to observe performance.',
      },
    },
  },
}

/**
 * Benchmark story: Compare Bixel rendering at different coarseness levels vs plain Bresenham pixel line
 */

interface BenchmarkMetric {
  technique: string
  totalTime: number
  avgTime: number
  avgPixels: number
  speedup: number | string
}

// Helper: Generate random snapped-to-grid lines
function generateSnappedLines(
  count: number,
  gridSize: number,
): Array<{ start: Point; end: Point }> {
  const lines: Array<{ start: Point; end: Point }> = []
  for (let i = 0; i < count; i++) {
    lines.push({
      start: {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      },
      end: {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      },
    })
  }
  return lines
}

// Helper: Expand bixel points to pixel blocks at given scale
function expandBixelsToPixels(points: Point[], scale: number, gridSize: number): Set<string> {
  const pixels = new Set<string>()
  const canvasSize = gridSize * 16 // 256 for 16x16 grid

  points.forEach((bixel) => {
    const basePx = bixel.x * scale
    const basePy = bixel.y * scale

    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const px = basePx + dx
        const py = basePy + dy
        if (px >= 0 && px < canvasSize && py >= 0 && py < canvasSize) {
          pixels.add(`${px},${py}`)
        }
      }
    }
  })

  return pixels
}

const BixelVsPixelBenchmark: React.FC<{ lineCount?: number }> = ({ lineCount = 1000 }) => {
  const [displayLineCount, setDisplayLineCount] = useState(lineCount)
  const [useCache, setUseCache] = useState(true)

  const benchmarkResults = useMemo(() => {
    const gridSize = 16
    const results: BenchmarkMetric[] = []

    // Generate test lines once (snapped to tile grid)
    const lines = generateSnappedLines(displayLineCount, gridSize)
    const TILE_SIZE = 16

    // 1. Plain Bresenham Pixel Line (baseline)
    {
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const startPx = line.start.x * TILE_SIZE + TILE_SIZE / 2
        const startPy = line.start.y * TILE_SIZE + TILE_SIZE / 2
        const endPx = line.end.x * TILE_SIZE + TILE_SIZE / 2
        const endPy = line.end.y * TILE_SIZE + TILE_SIZE / 2

        const result = bresenhamPixelLine(
          Math.floor(startPx),
          Math.floor(startPy),
          Math.floor(endPx),
          Math.floor(endPy),
        )

        pixelCounts.push(result.points.length)
      })

      const time = performance.now() - start
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: 'Pixel Bresenham',
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: 1.0,
      })
    }

    // Helper: Render line at bixel scale without caching
    const renderBixelAtScale = (line: LineSegment, scale: number): number => {
      const startPx = line.start.x * TILE_SIZE + TILE_SIZE / 2
      const startPy = line.start.y * TILE_SIZE + TILE_SIZE / 2
      const endPx = line.end.x * TILE_SIZE + TILE_SIZE / 2
      const endPy = line.end.y * TILE_SIZE + TILE_SIZE / 2

      const startBx = Math.floor(startPx / scale)
      const startBy = Math.floor(startPy / scale)
      const endBx = Math.floor(endPx / scale)
      const endBy = Math.floor(endPy / scale)

      const dx = endBx - startBx
      const dy = endBy - startBy

      const result = bresenhamBixelLine(0, 0, dx, dy)
      const pixels = expandBixelsToPixels(result.points, scale, gridSize)

      return pixels.size
    }

    // 2. Bixel 1x (pixel via bixel)
    {
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const count = renderBixelAtScale(line, 1)
        pixelCounts.push(count)
      })

      const time = performance.now() - start
      const baseline = results[0].totalTime
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: 'Bixel 1x',
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: (baseline / time).toFixed(2),
      })
    }

    // 3. Bixel 2x
    {
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const count = renderBixelAtScale(line, 2)
        pixelCounts.push(count)
      })

      const time = performance.now() - start
      const baseline = results[0].totalTime
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: 'Bixel 2x',
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: (baseline / time).toFixed(2),
      })
    }

    // 4. Bixel 4x
    {
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const count = renderBixelAtScale(line, 4)
        pixelCounts.push(count)
      })

      const time = performance.now() - start
      const baseline = results[0].totalTime
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: 'Bixel 4x',
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: (baseline / time).toFixed(2),
      })
    }

    // 5. Bixel 8x
    {
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const count = renderBixelAtScale(line, 8)
        pixelCounts.push(count)
      })

      const time = performance.now() - start
      const baseline = results[0].totalTime
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: 'Bixel 8x',
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: (baseline / time).toFixed(2),
      })
    }

    // 6. Bixel 16x (tile level)
    {
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const count = renderBixelAtScale(line, 16)
        pixelCounts.push(count)
      })

      const time = performance.now() - start
      const baseline = results[0].totalTime
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: 'Bixel 16x',
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: (baseline / time).toFixed(2),
      })
    }

    // 7. Bixel 4x with Memoization
    if (useCache) {
      const memoizer = createBixelMemoizer()
      const pixelCounts: number[] = []
      const start = performance.now()

      lines.forEach((line) => {
        const startPx = line.start.x * TILE_SIZE + TILE_SIZE / 2
        const startPy = line.start.y * TILE_SIZE + TILE_SIZE / 2
        const endPx = line.end.x * TILE_SIZE + TILE_SIZE / 2
        const endPy = line.end.y * TILE_SIZE + TILE_SIZE / 2

        const startBx = Math.floor(startPx / 4)
        const startBy = Math.floor(startPy / 4)
        const endBx = Math.floor(endPx / 4)
        const endBy = Math.floor(endPy / 4)

        const dx = endBx - startBx
        const dy = endBy - startBy

        const result = memoizer.bresenhamBixelLine(0, 0, dx, dy)
        const pixels = expandBixelsToPixels(result.points, 4, gridSize)
        pixelCounts.push(pixels.size)
      })

      const time = performance.now() - start
      const baseline = results[0].totalTime
      const stats = memoizer.getCacheStats()
      const avgPixels = pixelCounts.reduce((a, b) => a + b, 0) / pixelCounts.length

      results.push({
        technique: `Bixel 4x + Memo (${stats.size} cached)`,
        totalTime: time,
        avgTime: time / displayLineCount,
        avgPixels,
        speedup: (baseline / time).toFixed(2),
      })
    }

    return results
  }, [displayLineCount, useCache])

  const fastestTime = Math.min(...benchmarkResults.map((r) => r.totalTime))

  return (
    <div className="benchmark-container">
      <div className="benchmark-controls">
        <div className="control-group">
          <label>
            Lines: {displayLineCount.toLocaleString()}
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={displayLineCount}
              onChange={(e) => setDisplayLineCount(parseInt(e.target.value, 10))}
            />
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useCache}
              onChange={(e) => setUseCache(e.target.checked)}
            />
            Include Memoized 4x variant
          </label>
        </div>
      </div>

      <div className="results-section">
        <h2>Coarseness vs Performance Trade-off</h2>
        <p className="description">
          Lines are snapped to tile centers on a 16×16 grid. Coarser rendering (higher scale)
          reduces pixel count but may affect visual quality.
        </p>

        <table className="results-table">
          <thead>
            <tr>
              <th>Technique</th>
              <th>Total Time</th>
              <th>Avg/Line</th>
              <th>Avg Pixels</th>
              <th>vs Baseline</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkResults.map((result, idx) => {
              const isBaseline = idx === 0
              const isFastest = result.totalTime === fastestTime && !isBaseline
              return (
                <tr key={idx} className={`${isBaseline ? 'baseline' : ''} ${isFastest ? 'fastest' : ''}`}>
                  <td className="technique-name">
                    {result.technique}
                    {isBaseline && <span className="badge">baseline</span>}
                    {isFastest && <span className="badge fastest-badge">fastest</span>}
                  </td>
                  <td className="numeric">{result.totalTime.toFixed(2)}ms</td>
                  <td className="numeric">{(result.avgTime * 1000).toFixed(3)}μs</td>
                  <td className="numeric">{result.avgPixels.toFixed(1)}</td>
                  <td className="numeric speedup">{result.speedup}x</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="insights">
        <h3>Key Observations</h3>
        <ul>
          <li>
            <strong>Coarser = Faster</strong>: Higher coarseness reduces algorithm iterations
          </li>
          <li>
            <strong>Pixel count tradeoff</strong>: 1x is most accurate, 16x is fastest but blockiest
          </li>
          <li>
            <strong>Memoization wins</strong>: Cached variant shows huge speedup when lines repeat
          </li>
          <li>
            <strong>Grid-snapped lines</strong>: Starting/ending at tile centers simplifies cache keys
          </li>
        </ul>
      </div>

      <div className="recommendations">
        <h3>Recommendations by Use Case</h3>
        <ul>
          <li>
            <strong>Real-time rendering (games):</strong> Use Bixel 4x or 8x + Memoization
          </li>
          <li>
            <strong>Pixel-art editors:</strong> Use Bixel 1x for maximum accuracy
          </li>
          <li>
            <strong>Collision detection:</strong> Use Bixel 16x for speed (one bixel per tile)
          </li>
          <li>
            <strong>Repeated patterns:</strong> Always enable memoization when lines repeat
          </li>
        </ul>
      </div>
    </div>
  )
}

// Interface for line segment (same as in component)
interface LineSegment {
  start: Point
  end: Point
}

type Story2 = StoryObj

export const BixelVsPixelPerformance: Story2 = {
  render: () => <BixelVsPixelBenchmark lineCount={1000} />,
  parameters: {
    docs: {
      description: {
        story:
          'Benchmark comparing plain Bresenham pixel line vs Bixel rendering at different coarseness levels. Shows trade-off between computation speed and line accuracy.',
      },
    },
  },
}

export const LightLoad: Story2 = {
  render: () => <BixelVsPixelBenchmark lineCount={100} />,
  parameters: {
    docs: {
      description: {
        story: 'Light benchmark with 100 lines to explore behavior on minimal workload.',
      },
    },
  },
}

export const HeavyLoad: Story2 = {
  render: () => <BixelVsPixelBenchmark lineCount={5000} />,
  parameters: {
    docs: {
      description: {
        story: 'Heavy benchmark with 5000 lines to stress test performance differences.',
      },
    },
  },
}

export const InteractivePerformance: Story2 = {
  render: () => <BixelVsPixelBenchmark lineCount={1000} />,
  parameters: {
    docs: {
      description: {
        story: 'Adjust line count slider to interactively explore performance at different scales.',
      },
    },
  },
}
