import React from 'react';
import type { InspectorFrame } from './frame';
import { InspectorPrimitivesLayer } from './components/InspectorPrimitivesLayer';

export interface InspectorRendererProps {
  frame: InspectorFrame;
  width: number;
  height: number;
  tileSize: number;
  centerX: number;
  centerY: number;
  overlayMode?: boolean;
  showFollowLinks?: boolean;
  showVelocityVectors?: boolean;
  showCollisionTint?: boolean;
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
  overlayMode = false,
  showFollowLinks = true,
  showVelocityVectors = true,
  showCollisionTint = true,
}: InspectorRendererProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label="Inspector renderer overlay"
    >
      <InspectorPrimitivesLayer
        frame={frame}
        tileSize={tileSize}
        toScreenX={(x) => toScreenX(x, centerX, tileSize, width)}
        toScreenY={(y) => toScreenY(y, centerY, tileSize, height)}
        overlayMode={overlayMode}
        showFollowLinks={showFollowLinks}
        showVelocityVectors={showVelocityVectors}
        showCollisionTint={showCollisionTint}
      />
    </svg>
  );
}
