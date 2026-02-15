import React, { useState, useMemo } from 'react'
import {
  bresenhamPixelLine,
  bresenhamBixelLine,
  getBixelPixels,
  type Point,
} from '../lib/bixel-line-drawing'
import './BixelBenchmark.css'

export interface BixelBenchmarkProps {
  lineCount?: number
  canvasSize?: number
  gridSize?: number
}

interface BenchmarkResult {
  pixelTime: number
  bixelTime: number
  lineCount: number
  avgPixelTime: number
  avgBixelTime: number
}

/**
 * Performance benchmark comparing pixel-based vs bixel-based line drawing
 */
export const BixelBenchmark: React.FC<BixelBenchmarkProps> = ({
  lineCount = 5000,
  canvasSize = 250,
  gridSize = 16,
}) => {
  const [displayLineCount, setDisplayLineCount] = useState(lineCount)

  // Generate random lines and benchmark both approaches
  const results = useMemo(() => {
    // Generate random lines within the grid bounds
    const lines: Array<{ start: Point; end: Point }> = []
    for (let i = 0; i < displayLineCount; i++) {
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

    // Benchmark pixel-based approach
    const pixelStart = performance.now()
    const pixelLines = lines.map((line) =>
      bresenhamPixelLine(line.start.x * 4, line.start.y * 4, line.end.x * 4, line.end.y * 4),
    )
    const pixelTime = performance.now() - pixelStart

    // Benchmark bixel-based approach
    const bixelStart = performance.now()
    const bixelLines = lines.map((line) => bresenhamBixelLine(line.start.x, line.start.y, line.end.x, line.end.y))

    // Convert bixel points to pixels (this is part of the rendering cost)
    bixelLines.forEach((bixelLine) => {
      bixelLine.points.forEach((bixel) => {
        getBixelPixels(bixel.x, bixel.y)
      })
    })
    const bixelTime = performance.now() - bixelStart

    return {
      pixelTime,
      bixelTime,
      lineCount: displayLineCount,
      avgPixelTime: pixelTime / displayLineCount,
      avgBixelTime: bixelTime / displayLineCount,
    } as BenchmarkResult
  }, [displayLineCount, gridSize])

  const speedup = (results.pixelTime / results.bixelTime).toFixed(2)
  const pixelPixelCount = Math.round((results.avgPixelTime * 1000000) / 1000) / 1000
  const bixelPixelCount = Math.round((results.avgBixelTime * 1000000) / 1000) / 1000

  return (
    <div className="bixel-benchmark">
      <div className="controls">
        <label>
          Lines to render: {displayLineCount.toLocaleString()}
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={displayLineCount}
            onChange={(e) => setDisplayLineCount(parseInt(e.target.value, 10))}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
      </div>

      <div className="results-grid">
        <div className="result-card pixel-card">
          <h3>Pixel-Based Bresenham</h3>
          <div className="metric">
            <span className="label">Total Time:</span>
            <span className="value">{results.pixelTime.toFixed(2)}ms</span>
          </div>
          <div className="metric">
            <span className="label">Avg per line:</span>
            <span className="value">{pixelPixelCount.toFixed(3)}ms</span>
          </div>
        </div>

        <div className="result-card bixel-card">
          <h3>Bixel-Based Bresenham</h3>
          <div className="metric">
            <span className="label">Total Time:</span>
            <span className="value">{results.bixelTime.toFixed(2)}ms</span>
          </div>
          <div className="metric">
            <span className="label">Avg per line:</span>
            <span className="value">{bixelPixelCount.toFixed(3)}ms</span>
          </div>
        </div>

        <div className="result-card comparison-card">
          <h3>Comparison</h3>
          <div className="metric">
            <span className="label">Speedup:</span>
            <span className="value">{speedup}x</span>
          </div>
          <div className="metric">
            <span className="label">Difference:</span>
            <span className="value">{(results.pixelTime - results.bixelTime).toFixed(2)}ms</span>
          </div>
          <div className="metric">
            <span className="label">Winner:</span>
            <span className={`value ${results.bixelTime < results.pixelTime ? 'winner' : 'slower'}`}>
              {results.bixelTime < results.pixelTime ? 'Bixel' : 'Pixel'}
            </span>
          </div>
        </div>
      </div>

      <div className="info">
        <p>
          <strong>Benchmark Details:</strong> Each line is drawn on a {gridSize}×{gridSize} grid using Bresenham's
          algorithm. The pixel-based approach works directly with pixels, while the bixel approach works with 4×4 bixel
          units then converts each bixel point to its constituent pixels.
        </p>
        <p>
          <strong>Notes:</strong> Results may vary based on your system. This benchmark includes all computation
          overhead including point conversion and coordinate transformation.
        </p>
      </div>
    </div>
  )
}
