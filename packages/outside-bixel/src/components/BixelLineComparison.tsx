import React, { useState, useMemo } from 'react'
import {
  bresenhamPixelLine,
  bresenhamBixelLine,
  getBixelPixels,
  type Point,
} from '../lib/bixel-line-drawing'
import './BixelLineComparison.css'

export interface LineConfig {
  name: string
  start: Point
  end: Point
  color?: string
}

export interface BixelLineComparisonProps {
  lines: LineConfig[]
  zoomMultiplier?: number
  gridSize?: number
  showBixelGrid?: boolean
}

/**
 * Side-by-side comparison of Pixel-based vs Bixel-based line drawing
 */
export const BixelLineComparison: React.FC<BixelLineComparisonProps> = ({
  lines,
  zoomMultiplier = 4,
  gridSize = 16,
  showBixelGrid = true,
}) => {
  const [zoom, setZoom] = useState(zoomMultiplier)

  const canvasSize = gridSize * zoom

  // Process lines for both rendering methods
  const processedLines = useMemo(() => {
    return lines.map((line) => {
      // Pixel-based rendering
      const pixelLine = bresenhamPixelLine(
        line.start.x * zoom,
        line.start.y * zoom,
        line.end.x * zoom,
        line.end.y * zoom,
      )

      // Bixel-based rendering
      const bixelLine = bresenhamBixelLine(line.start.x, line.start.y, line.end.x, line.end.y)

      // Convert bixel points to pixel coordinates for rendering
      const bixelPixels = new Set<string>()
      bixelLine.points.forEach((bixel) => {
        const pixelPoints = getBixelPixels(bixel.x, bixel.y)
        pixelPoints.forEach((p) => {
          bixelPixels.add(`${p.x},${p.y}`)
        })
      })

      return {
        ...line,
        pixelLine,
        bixelLine,
        bixelPixels,
      }
    })
  }, [lines, zoom])

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseInt(e.target.value, 10))
  }

  return (
    <div className="bixel-comparison">
      <div className="controls">
        <label>
          Zoom: {zoom}x
          <input
            type="range"
            min="1"
            max="16"
            value={zoom}
            onChange={handleZoomChange}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
      </div>

      <div className="comparison-container">
        {/* Pixel-based rendering */}
        <div className="rendering-section">
          <h3>Pixel-Based Bresenham</h3>
          <div className="canvas-wrapper">
            <svg width={canvasSize + 20} height={canvasSize + 20} className="grid-canvas">
              <defs>
                <pattern
                  id="pixelGrid"
                  width={zoom}
                  height={zoom}
                  patternUnits="userSpaceOnUse"
                >
                  <path d={`M ${zoom} 0 L 0 0 0 ${zoom}`} fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width={canvasSize} height={canvasSize} fill="url(#pixelGrid)" x="10" y="10" />
              <rect
                width={canvasSize}
                height={canvasSize}
                fill="none"
                stroke="#999"
                strokeWidth="1"
                x="10"
                y="10"
              />

              {/* Draw lines */}
              {processedLines.map((line, idx) => (
                <g key={`pixel-${idx}`}>
                  {line.pixelLine.points.map((point, pidx) => (
                    <rect
                      key={`pixel-${idx}-${pidx}`}
                      x={10 + point.x}
                      y={10 + point.y}
                      width="1"
                      height="1"
                      fill={line.color || `hsl(${(idx * 60) % 360}, 70%, 50%)`}
                    />
                  ))}
                </g>
              ))}
            </svg>
          </div>
          <div className="line-legend">
            {processedLines.map((line, idx) => (
              <div key={`pixel-legend-${idx}`} className="legend-item">
                <span
                  className="legend-color"
                  style={{
                    backgroundColor: line.color || `hsl(${(idx * 60) % 360}, 70%, 50%)`,
                  }}
                ></span>
                <span>{line.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bixel-based rendering */}
        <div className="rendering-section">
          <h3>4bx Bixel-Based</h3>
          <div className="canvas-wrapper">
            <svg width={canvasSize + 20} height={canvasSize + 20} className="grid-canvas">
              <defs>
                <pattern
                  id="bixelGrid"
                  width={zoom * 4}
                  height={zoom * 4}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${zoom * 4} 0 L 0 0 0 ${zoom * 4}`}
                    fill="none"
                    stroke="#ccc"
                    strokeWidth="0.5"
                  />
                </pattern>
                <pattern id="pixelSubGrid" width={zoom} height={zoom} patternUnits="userSpaceOnUse">
                  <path d={`M ${zoom} 0 L 0 0 0 ${zoom}`} fill="none" stroke="#f0f0f0" strokeWidth="0.25" />
                </pattern>
              </defs>

              {/* Background grids */}
              {showBixelGrid && (
                <>
                  <rect width={canvasSize} height={canvasSize} fill="url(#pixelSubGrid)" x="10" y="10" />
                  <rect
                    width={canvasSize}
                    height={canvasSize}
                    fill="url(#bixelGrid)"
                    x="10"
                    y="10"
                    opacity="0.3"
                  />
                </>
              )}
              <rect
                width={canvasSize}
                height={canvasSize}
                fill="none"
                stroke="#999"
                strokeWidth="1"
                x="10"
                y="10"
              />

              {/* Draw bixel lines */}
              {processedLines.map((line, idx) => (
                <g key={`bixel-${idx}`}>
                  {Array.from(line.bixelPixels).map((pixelKey, pidx) => {
                    const [x, y] = pixelKey.split(',').map(Number)
                    return (
                      <rect
                        key={`bixel-${idx}-${pidx}`}
                        x={10 + x}
                        y={10 + y}
                        width="1"
                        height="1"
                        fill={line.color || `hsl(${(idx * 60) % 360}, 70%, 50%)`}
                      />
                    )
                  })}
                </g>
              ))}
            </svg>
          </div>
          <div className="line-legend">
            {processedLines.map((line, idx) => (
              <div key={`bixel-legend-${idx}`} className="legend-item">
                <span
                  className="legend-color"
                  style={{
                    backgroundColor: line.color || `hsl(${(idx * 60) % 360}, 70%, 50%)`,
                  }}
                ></span>
                <span>{line.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="info">
        <p>
          <strong>Left:</strong> Classic Bresenham's algorithm operating on pixel coordinates
        </p>
        <p>
          <strong>Right:</strong> Bixel-based Bresenham's algorithm using 4bx units (4×4 pixel blocks)
        </p>
        <p>
          <strong>Bixel Grid:</strong> Subtle grid lines show 4×4 bixel boundaries. Fine grid shows individual pixels.
        </p>
      </div>
    </div>
  )
}
