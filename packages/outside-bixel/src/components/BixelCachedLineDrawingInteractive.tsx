import React, { useState, useRef, useMemo } from 'react'
import { bresenhamBixelLine, bresenhamPixelLine, type Point } from '../lib/bixel-line-drawing'
import './BixelCachedLineDrawingInteractive.css'

interface LineSegment {
  id: string
  start: Point
  end: Point
}

interface DragState {
  lineId: string
  endpoint: 'start' | 'end'
  isDragging: boolean
}

type CoarsenessLevel = 1 | 2 | 4 | 8 | 16

/**
 * Interactive bixel line drawing with multi-level caching by normalized direction vector.
 * Caches lines at 5 coarseness levels (1x, 2x, 4x, 8x, 16x).
 * Demonstrates performance trade-off between computation cost and rendering quality.
 */
export const BixelCachedLineDrawingInteractive: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<LineSegment[]>([])
  const [selectedTile, setSelectedTile] = useState<Point | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredTile, setHoveredTile] = useState<Point | null>(null)
  const [coarsenessLevel, setCoarsenessLevel] = useState<CoarsenessLevel>(4)

  // Cache: Map<"dx_dy", Map<level, pixels>>
  const lineCacheRef = useRef<Map<string, Map<CoarsenessLevel, Set<string>>>>(new Map())
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 })

  const GRID_SIZE = 16
  const TILE_SIZE = 16
  const CANVAS_SIZE = GRID_SIZE * TILE_SIZE

  const snapToTileCenter = (pixelX: number, pixelY: number): Point => {
    const tileX = Math.floor(pixelX / TILE_SIZE)
    const tileY = Math.floor(pixelY / TILE_SIZE)
    const clampedX = Math.max(0, Math.min(tileX, GRID_SIZE - 1))
    const clampedY = Math.max(0, Math.min(tileY, GRID_SIZE - 1))
    return { x: clampedX, y: clampedY }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const pixelX = e.clientX - rect.left
    const pixelY = e.clientY - rect.top
    const clickedTile = snapToTileCenter(pixelX, pixelY)

    if (!selectedTile) {
      setSelectedTile(clickedTile)
    } else {
      if (clickedTile.x === selectedTile.x && clickedTile.y === selectedTile.y) {
        setSelectedTile(null)
      } else {
        const newLine: LineSegment = {
          id: `line-${Date.now()}`,
          start: selectedTile,
          end: clickedTile,
        }
        setLines([...lines, newLine])
        setSelectedTile(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const pixelX = e.clientX - rect.left
    const pixelY = e.clientY - rect.top
    const hovered = snapToTileCenter(pixelX, pixelY)
    setHoveredTile(hovered)

    if (dragState) {
      const newLines = lines.map((line) => {
        if (line.id === dragState.lineId) {
          return {
            ...line,
            [dragState.endpoint]: hovered,
          }
        }
        return line
      })
      setLines(newLines)
    }
  }

  const handleEndpointMouseDown = (
    e: React.MouseEvent<SVGCircleElement>,
    lineId: string,
    endpoint: 'start' | 'end',
  ) => {
    e.stopPropagation()
    setDragState({ lineId, endpoint, isDragging: true })
  }

  const handleMouseUp = () => {
    setDragState(null)
  }

  const deleteLine = (lineId: string) => {
    setLines(lines.filter((line) => line.id !== lineId))
  }

  const clearAllLines = () => {
    setLines([])
    setSelectedTile(null)
    lineCacheRef.current.clear()
    setCacheStats({ hits: 0, misses: 0 })
  }

  /**
   * Compute cache key from normalized bixel delta at given scale.
   * Key encodes the line direction and length at that scale.
   */
  const getCacheKey = (line: LineSegment, level: CoarsenessLevel): string => {
    const startPx = line.start.x * TILE_SIZE + TILE_SIZE / 2
    const startPy = line.start.y * TILE_SIZE + TILE_SIZE / 2
    const endPx = line.end.x * TILE_SIZE + TILE_SIZE / 2
    const endPy = line.end.y * TILE_SIZE + TILE_SIZE / 2

    const startBx = Math.floor(startPx / level)
    const startBy = Math.floor(startPy / level)
    const endBx = Math.floor(endPx / level)
    const endBy = Math.floor(endPy / level)

    const dx = endBx - startBx
    const dy = endBy - startBy

    return `${dx}_${dy}`
  }

  /**
   * Render a line at a given coarseness level using cache.
   * Returns pixel set for this line at this level.
   */
  const renderLineAtLevel = (line: LineSegment, level: CoarsenessLevel): Set<string> => {
    const cacheKey = getCacheKey(line, level)
    const cache = lineCacheRef.current

    let pixelMap = cache.get(cacheKey)?.get(level)

    if (pixelMap) {
      // Cache hit
      setCacheStats((prev) => ({ ...prev, hits: prev.hits + 1 }))
      return pixelMap
    }

    // Cache miss: compute at this level and store in all levels
    pixelMap = new Set<string>()

    if (level === 1) {
      // Pixel-level: use bresenhamPixelLine directly
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

      result.points.forEach((p) => {
        pixelMap!.add(`${p.x},${p.y}`)
      })
    } else {
      // Bixel-level rendering: compute delta, run bresenhamBixelLine, expand blocks
      const startPx = line.start.x * TILE_SIZE + TILE_SIZE / 2
      const startPy = line.start.y * TILE_SIZE + TILE_SIZE / 2
      const endPx = line.end.x * TILE_SIZE + TILE_SIZE / 2
      const endPy = line.end.y * TILE_SIZE + TILE_SIZE / 2

      const startBx = Math.floor(startPx / level)
      const startBy = Math.floor(startPy / level)
      const endBx = Math.floor(endPx / level)
      const endBy = Math.floor(endPy / level)

      const dx = endBx - startBx
      const dy = endBy - startBy

      // Run Bresenham from origin to delta
      const result = bresenhamBixelLine(0, 0, dx, dy)

      // Expand each bixel to level×level pixels, translated by start position
      result.points.forEach((bixel) => {
        const basePx = (startBx + bixel.x) * level
        const basePy = (startBy + bixel.y) * level

        for (let dy_pix = 0; dy_pix < level; dy_pix++) {
          for (let dx_pix = 0; dx_pix < level; dx_pix++) {
            const px = basePx + dx_pix
            const py = basePy + dy_pix

            if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) {
              pixelMap!.add(`${px},${py}`)
            }
          }
        }
      })
    }

    // Store in cache for this level
    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, new Map())
    }
    cache.get(cacheKey)!.set(level, pixelMap)

    setCacheStats((prev) => ({ ...prev, misses: prev.misses + 1 }))
    return pixelMap
  }

  // Compute all pixels at current coarseness level
  const displayPixels = useMemo(() => {
    const allPixels = new Set<string>()

    lines.forEach((line) => {
      const linePixels = renderLineAtLevel(line, coarsenessLevel)
      linePixels.forEach((p) => allPixels.add(p))
    })

    return allPixels
  }, [lines, coarsenessLevel])

  const cacheHitRatio =
    cacheStats.hits + cacheStats.misses > 0
      ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)
      : '—'

  return (
    <div className="bixel-cached-demo">
      <div className="demo-controls">
        <div className="info-panel">
          <h3>Cached Bixel Line Drawing</h3>
          <ul className="instructions">
            <li>
              <strong>Draw:</strong> Click two tiles to draw a line between them
            </li>
            <li>
              <strong>Modify:</strong> Drag the circle endpoints to move line points
            </li>
            <li>
              <strong>Delete:</strong> Click the X button on a line to remove it
            </li>
            <li>
              <strong>Cache:</strong> Lines cached by normalized direction; cache hits are instant
            </li>
          </ul>

          <div className="coarseness-controls">
            <label>Coarseness Level:</label>
            <div className="level-buttons">
              {[1, 2, 4, 8, 16].map((level) => (
                <button
                  key={level}
                  className={`level-btn ${coarsenessLevel === level ? 'active' : ''}`}
                  onClick={() => setCoarsenessLevel(level as CoarsenessLevel)}
                >
                  {level}x
                </button>
              ))}
            </div>
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="label">Lines:</span>
              <span className="value">{lines.length}</span>
            </div>
            {lines.length > 0 && (
              <>
                <div className="stat-item">
                  <span className="label">Pixels at {coarsenessLevel}x:</span>
                  <span className="value">{displayPixels.size}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Cache Hits:</span>
                  <span className="value" style={{ color: '#4ecdc4' }}>
                    {cacheStats.hits}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="label">Cache Misses:</span>
                  <span className="value" style={{ color: '#ffd93d' }}>
                    {cacheStats.misses}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="label">Hit Ratio:</span>
                  <span className="value">{cacheHitRatio}%</span>
                </div>
              </>
            )}
          </div>

          {lines.length > 0 && (
            <button onClick={clearAllLines} className="clear-button">
              Clear All Lines
            </button>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="bixel-canvas"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        style={{
          width: `${CANVAS_SIZE}px`,
          height: `${CANVAS_SIZE}px`,
        }}
      >
        {/* Grid background */}
        <svg
          className="grid-overlay"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={i * TILE_SIZE}
                y1="0"
                x2={i * TILE_SIZE}
                y2={CANVAS_SIZE}
                className="grid-line"
              />
              <line
                x1="0"
                y1={i * TILE_SIZE}
                x2={CANVAS_SIZE}
                y2={i * TILE_SIZE}
                className="grid-line"
              />
            </g>
          ))}

          {/* Draw cached line pixels */}
          {Array.from(displayPixels).map((key) => {
            const [x, y] = key.split(',').map(Number)
            return (
              <rect
                key={`pixel-${key}`}
                x={x}
                y={y}
                width="1"
                height="1"
                className="cached-pixel"
              />
            )
          })}

          {/* Line references and endpoints */}
          {lines.map((line) => {
            const startPixel = {
              x: line.start.x * TILE_SIZE + TILE_SIZE / 2,
              y: line.start.y * TILE_SIZE + TILE_SIZE / 2,
            }
            const endPixel = {
              x: line.end.x * TILE_SIZE + TILE_SIZE / 2,
              y: line.end.y * TILE_SIZE + TILE_SIZE / 2,
            }

            return (
              <g key={`line-${line.id}`}>
                <line
                  x1={startPixel.x}
                  y1={startPixel.y}
                  x2={endPixel.x}
                  y2={endPixel.y}
                  className="line-reference"
                />

                <circle
                  cx={startPixel.x}
                  cy={startPixel.y}
                  r="4"
                  className="endpoint start"
                  onMouseDown={(e) => handleEndpointMouseDown(e, line.id, 'start')}
                  style={{ cursor: 'grab' }}
                />

                <circle
                  cx={endPixel.x}
                  cy={endPixel.y}
                  r="4"
                  className="endpoint end"
                  onMouseDown={(e) => handleEndpointMouseDown(e, line.id, 'end')}
                  style={{ cursor: 'grab' }}
                />
              </g>
            )
          })}

          {/* Tile highlights */}
          {selectedTile && (
            <rect
              x={selectedTile.x * TILE_SIZE}
              y={selectedTile.y * TILE_SIZE}
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="selected-tile"
            />
          )}

          {hoveredTile &&
            !(selectedTile && hoveredTile.x === selectedTile.x && hoveredTile.y === selectedTile.y) && (
              <rect
                x={hoveredTile.x * TILE_SIZE}
                y={hoveredTile.y * TILE_SIZE}
                width={TILE_SIZE}
                height={TILE_SIZE}
                className="hovered-tile"
              />
            )}
        </svg>

        {/* Delete buttons */}
        <div className="lines-overlay">
          {lines.map((line) => {
            const startPixel = {
              x: line.start.x * TILE_SIZE + TILE_SIZE / 2,
              y: line.start.y * TILE_SIZE + TILE_SIZE / 2,
            }
            const endPixel = {
              x: line.end.x * TILE_SIZE + TILE_SIZE / 2,
              y: line.end.y * TILE_SIZE + TILE_SIZE / 2,
            }

            return (
              <div key={`delete-${line.id}`} className="line-delete-container">
                <button
                  className="delete-button"
                  onClick={() => deleteLine(line.id)}
                  style={{
                    left: `${(startPixel.x + endPixel.x) / 2 - 8}px`,
                    top: `${(startPixel.y + endPixel.y) / 2 - 8}px`,
                  }}
                  title="Delete line"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="demo-info">
        <p>
          <strong>Canvas:</strong> 16×16 tiles (256×256 pixels)
        </p>
        <p>
          <strong>Caching:</strong> Lines cached by normalized bixel delta (direction + distance at each scale)
        </p>
        <p>
          <strong>Coarseness:</strong> 1x=pixel, 2x=2px blocks, 4x=4bx, 8x=8px, 16x=tiles
        </p>
      </div>
    </div>
  )
}
