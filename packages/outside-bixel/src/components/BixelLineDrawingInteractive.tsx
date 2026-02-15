import React, { useState, useRef, useMemo } from 'react'
import { bresenhamBixelLine, type Point } from '../lib/bixel-line-drawing'
import './BixelLineDrawingInteractive.css'

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

/**
 * Interactive bixel line drawing on a 16×16 tile grid
 * Click tiles to draw lines, drag endpoints to modify them
 */
export const BixelLineDrawingInteractive: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<LineSegment[]>([])
  const [selectedTile, setSelectedTile] = useState<Point | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredTile, setHoveredTile] = useState<Point | null>(null)

  const GRID_SIZE = 16 // 16×16 tiles
  const TILE_SIZE = 16 // pixels per tile
  const CANVAS_SIZE = GRID_SIZE * TILE_SIZE // 256×256 pixels

  // Snap pixel coordinates to tile center
  const snapToTileCenter = (pixelX: number, pixelY: number): Point => {
    const tileX = Math.floor(pixelX / TILE_SIZE)
    const tileY = Math.floor(pixelY / TILE_SIZE)
    // Clamp to grid
    const clampedX = Math.max(0, Math.min(tileX, GRID_SIZE - 1))
    const clampedY = Math.max(0, Math.min(tileY, GRID_SIZE - 1))
    return { x: clampedX, y: clampedY }
  }

  // Handle canvas click to select tiles and create lines
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const pixelX = e.clientX - rect.left
    const pixelY = e.clientY - rect.top

    const clickedTile = snapToTileCenter(pixelX, pixelY)

    if (!selectedTile) {
      // First click: select start point
      setSelectedTile(clickedTile)
    } else {
      // Second click: create line
      if (clickedTile.x === selectedTile.x && clickedTile.y === selectedTile.y) {
        // Clicking same tile again: deselect
        setSelectedTile(null)
      } else {
        // Create new line
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

  // Handle mouse move for hover and dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const pixelX = e.clientX - rect.left
    const pixelY = e.clientY - rect.top

    const hovered = snapToTileCenter(pixelX, pixelY)
    setHoveredTile(hovered)

    // Handle dragging endpoint
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

  // Start dragging an endpoint
  const handleEndpointMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    lineId: string,
    endpoint: 'start' | 'end',
  ) => {
    e.stopPropagation()
    setDragState({ lineId, endpoint, isDragging: true })
  }

  // Stop dragging
  const handleMouseUp = () => {
    setDragState(null)
  }

  // Delete a line
  const deleteLine = (lineId: string) => {
    setLines(lines.filter((line) => line.id !== lineId))
  }

  // Clear all lines
  const clearAllLines = () => {
    setLines([])
    setSelectedTile(null)
  }

  // Compute all pixels for all lines
  const allLinePixels = useMemo(() => {
    const pixelMap = new Set<string>()

    lines.forEach((line) => {
      const result = bresenhamBixelLine(line.start.x, line.start.y, line.end.x, line.end.y)
      result.points.forEach((point) => {
        // Each bixel is a 16×16 pixel area
        for (let dy = 0; dy < TILE_SIZE; dy++) {
          for (let dx = 0; dx < TILE_SIZE; dx++) {
            const px = point.x * TILE_SIZE + dx
            const py = point.y * TILE_SIZE + dy
            pixelMap.add(`${px},${py}`)
          }
        }
      })
    })

    return pixelMap
  }, [lines])

  return (
    <div className="bixel-interactive-demo">
      <div className="demo-controls">
        <div className="info-panel">
          <h3>Interactive Bixel Line Drawing</h3>
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
          </ul>

          <div className="stats">
            <div className="stat-item">
              <span className="label">Lines:</span>
              <span className="value">{lines.length}</span>
            </div>
            {lines.length > 0 && (
              <div className="stat-item">
                <span className="label">Total Points:</span>
                <span className="value">
                  {lines.reduce((sum, line) => {
                    const result = bresenhamBixelLine(line.start.x, line.start.y, line.end.x, line.end.y)
                    return sum + result.points.length
                  }, 0)}
                </span>
              </div>
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
          {/* Tile grid lines */}
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

          {/* Draw line pixels */}
          {Array.from(allLinePixels).map((key) => {
            const [x, y] = key.split(',').map(Number)
            return (
              <rect
                key={`pixel-${key}`}
                x={x}
                y={y}
                width="1"
                height="1"
                className="line-pixel"
              />
            )
          })}

          {/* Draw line segments (for reference) */}
          {lines.map((line, idx) => {
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
                {/* Line reference (faint) */}
                <line
                  x1={startPixel.x}
                  y1={startPixel.y}
                  x2={endPixel.x}
                  y2={endPixel.y}
                  className="line-reference"
                />

                {/* Start point */}
                <circle
                  cx={startPixel.x}
                  cy={startPixel.y}
                  r="4"
                  className="endpoint start"
                  onMouseDown={(e) => handleEndpointMouseDown(e, line.id, 'start')}
                  style={{ cursor: 'grab' }}
                />

                {/* End point */}
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

          {/* Selected tile highlight */}
          {selectedTile && (
            <rect
              x={selectedTile.x * TILE_SIZE}
              y={selectedTile.y * TILE_SIZE}
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="selected-tile"
            />
          )}

          {/* Hovered tile highlight */}
          {hoveredTile && !(selectedTile && hoveredTile.x === selectedTile.x && hoveredTile.y === selectedTile.y) && (
            <rect
              x={hoveredTile.x * TILE_SIZE}
              y={hoveredTile.y * TILE_SIZE}
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="hovered-tile"
            />
          )}
        </svg>

        {/* Lines list with delete buttons */}
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
                {/* Delete button positioned at midpoint */}
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
          <strong>Algorithm:</strong> Bresenham's line drawing on bixel coordinates
        </p>
        <p>
          <strong>Coordinate System:</strong> Tiles snap to grid, line drawn at tile level (1 tile = 1 bixel)
        </p>
      </div>
    </div>
  )
}
