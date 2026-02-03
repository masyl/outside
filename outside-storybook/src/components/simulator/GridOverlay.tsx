import { query, getComponent, Grid, GridResolution } from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import {
  FLOOR_TILES_RESOLUTION,
  SUB_POSITION_SNAP_RESOLUTION,
} from '@outside/simulator';

export interface ViewBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface ViewTransform {
  toX: (x: number) => number;
  toY: (y: number) => number;
}

export interface GridOverlayProps {
  world: SimulatorWorld;
  bounds: ViewBounds;
  transform: ViewTransform;
}

function linePositions(
  min: number,
  max: number,
  resolution: number
): number[] {
  const out: number[] = [];
  const start = Math.ceil(min / resolution) * resolution;
  const end = Math.floor(max / resolution) * resolution;
  for (let v = start; v <= end; v += resolution) {
    out.push(v);
  }
  return out;
}

/**
 * Renders viewport-clipped grid lines for each grid entity.
 * floorTiles (resolution 1): 30% white solid 1px.
 * subPositionSnap (resolution 0.125): 10% white dotted 1px.
 */
export function GridOverlay({ world, bounds, transform }: GridOverlayProps) {
  const grids = query(world, [Grid, GridResolution]);
  const lines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeOpacity: number;
    strokeDasharray: string;
  }> = [];

  grids.forEach((eid) => {
    const res = getComponent(world, eid, GridResolution).value;
    const isFloorTiles = Math.abs(res - FLOOR_TILES_RESOLUTION) < 1e-6;
    const strokeOpacity = isFloorTiles ? 0.3 : 0.1;
    const strokeDasharray = isFloorTiles ? 'none' : '2,2';

    const xPositions = linePositions(bounds.xMin, bounds.xMax, res);
    const yPositions = linePositions(bounds.yMin, bounds.yMax, res);

    xPositions.forEach((x) => {
      lines.push({
        x1: transform.toX(x),
        y1: transform.toY(bounds.yMin),
        x2: transform.toX(x),
        y2: transform.toY(bounds.yMax),
        strokeOpacity,
        strokeDasharray,
      });
    });
    yPositions.forEach((y) => {
      lines.push({
        x1: transform.toX(bounds.xMin),
        y1: transform.toY(y),
        x2: transform.toX(bounds.xMax),
        y2: transform.toY(y),
        strokeOpacity,
        strokeDasharray,
      });
    });
  });

  return (
    <g aria-hidden="true">
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#fff"
          strokeWidth={1}
          strokeOpacity={line.strokeOpacity}
          strokeDasharray={line.strokeDasharray}
        />
      ))}
    </g>
  );
}
