import React from 'react';
import type { InspectorFrame } from './frame';

export interface InspectorRendererProps {
  frame: InspectorFrame;
  width: number;
  height: number;
  tileSize: number;
  centerX: number;
  centerY: number;
}

function toScreenX(worldX: number, centerX: number, tileSize: number, width: number): number {
  return width / 2 + (worldX - centerX) * tileSize;
}

function toScreenY(worldY: number, centerY: number, tileSize: number, height: number): number {
  return height / 2 - (worldY - centerY) * tileSize;
}

/**
 * Stateless SVG renderer for inspector frame data.
 */
export function InspectorRenderer({
  frame,
  width,
  height,
  tileSize,
  centerX,
  centerY,
}: InspectorRendererProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label="Inspector renderer overlay"
    >
      <g aria-hidden="true">
        {frame.tiles.map((tile) => {
          const sizePx = tile.size * tileSize;
          const left = toScreenX(tile.x, centerX, tileSize, width);
          const top = toScreenY(tile.y + tile.size, centerY, tileSize, height);
          return (
            <rect
              key={`tile-${tile.eid}`}
              x={left}
              y={top}
              width={sizePx}
              height={sizePx}
              fill={tile.kind === 'wall' ? '#7a7a7a' : '#2f2f2f'}
              fillOpacity={0.45}
              stroke={tile.kind === 'wall' ? '#b5b5b5' : '#555'}
              strokeWidth={1}
            />
          );
        })}
      </g>
      <g aria-hidden="true">
        {frame.entities.map((entity) => {
          const radius = (entity.diameter * tileSize) / 2;
          return (
            <circle
              key={`entity-${entity.eid}`}
              cx={toScreenX(entity.x, centerX, tileSize, width)}
              cy={toScreenY(entity.y, centerY, tileSize, height)}
              r={radius}
              fill={
                entity.kind === 'hero'
                  ? '#ff5252'
                  : entity.kind === 'food'
                    ? '#8bd25a'
                    : entity.kind === 'bot'
                      ? '#7ec8ff'
                      : '#ff00ff'
              }
              fillOpacity={0.5}
              stroke="#111"
              strokeWidth={1}
            />
          );
        })}
      </g>
    </svg>
  );
}
