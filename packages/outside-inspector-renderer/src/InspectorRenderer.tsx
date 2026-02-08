import React from 'react';
import type { InspectorFrame } from './frame';

export interface InspectorRendererProps {
  frame: InspectorFrame;
  width: number;
  height: number;
  tileSize: number;
  centerX: number;
  centerY: number;
  showFollowLinks?: boolean;
  showVelocityVectors?: boolean;
  showCollisionTint?: boolean;
}

const COLLIDED_COOLDOWN_MAX = 2;
const ARROW_SCALE = 1;
const ARROW_HEAD_LEN = 8;
const ARROW_HEAD_HALF_W = 4;

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
      <g aria-hidden="true">
        {frame.tiles.map((tile) => {
          const sizePx = tile.size * tileSize;
          const left = toScreenX(tile.x, centerX, tileSize, width);
          const top = toScreenY(tile.y + tile.size, centerY, tileSize, height);
          const wallCollided = showCollisionTint && tile.kind === 'wall' && tile.inCollidedCooldown;
          const fillOpacity = wallCollided
            ? tile.collidedTicksRemaining / COLLIDED_COOLDOWN_MAX
            : 0.45;
          return (
            <rect
              key={`tile-${tile.eid}`}
              x={left}
              y={top}
              width={sizePx}
              height={sizePx}
              data-inspector-kind={tile.kind}
              fill={wallCollided ? '#6af' : tile.kind === 'wall' ? '#888' : '#2f2f2f'}
              fillOpacity={fillOpacity}
              stroke={tile.kind === 'wall' ? '#b5b5b5' : '#555'}
              strokeWidth={1}
            />
          );
        })}
      </g>
      {showFollowLinks ? (
        <g aria-hidden="true" data-inspector-layer="follow-links">
          {frame.followLinks.map((link) => (
            <line
              key={`follow-${link.followerEid}-${link.targetEid}`}
              x1={toScreenX(link.fromX, centerX, tileSize, width)}
              y1={toScreenY(link.fromY, centerY, tileSize, height)}
              x2={toScreenX(link.toX, centerX, tileSize, width)}
              y2={toScreenY(link.toY, centerY, tileSize, height)}
              stroke="#6af"
              strokeWidth={1}
              strokeOpacity={0.8}
            />
          ))}
        </g>
      ) : null}
      {showVelocityVectors ? (
        <g aria-hidden="true" data-inspector-layer="velocity-vectors">
          {frame.entities.map((entity) => {
            if (entity.directionRad == null || entity.speedTilesPerSec == null) {
              return null;
            }
            const speed = entity.speedTilesPerSec;
            if (!Number.isFinite(speed) || speed <= 0) {
              return null;
            }

            const cx = toScreenX(entity.x, centerX, tileSize, width);
            const cy = toScreenY(entity.y, centerY, tileSize, height);
            const len = speed * tileSize * ARROW_SCALE;
            const cos = Math.cos(entity.directionRad);
            const sin = Math.sin(entity.directionRad);
            const ex = cx + cos * len;
            const ey = cy - sin * len;
            const backX = ex - cos * ARROW_HEAD_LEN;
            const backY = ey + sin * ARROW_HEAD_LEN;
            const leftX = backX + sin * ARROW_HEAD_HALF_W;
            const leftY = backY + cos * ARROW_HEAD_HALF_W;
            const rightX = backX - sin * ARROW_HEAD_HALF_W;
            const rightY = backY - cos * ARROW_HEAD_HALF_W;
            const arrowPoints = `${ex},${ey} ${leftX},${leftY} ${rightX},${rightY}`;

            return (
              <g key={`arrow-${entity.eid}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={backX}
                  y2={backY}
                  stroke="#fc6"
                  strokeWidth={1.5}
                  strokeOpacity={0.9}
                />
                <polygon points={arrowPoints} fill="#fc6" fillOpacity={0.9} stroke="none" />
              </g>
            );
          })}
        </g>
      ) : null}
      <g aria-hidden="true">
        {frame.entities.map((entity) => {
          const radius = (entity.diameter * tileSize) / 2;
          const isCollisionTinted = showCollisionTint && entity.inCollidedCooldown;
          const collidedOpacity = entity.collidedTicksRemaining / COLLIDED_COOLDOWN_MAX;
          const isCollisionActive = entity.collidedTicksRemaining >= COLLIDED_COOLDOWN_MAX;
          let fill = '#ff00ff';
          let stroke = '#111';

          if (entity.kind === 'hero') {
            fill = '#fff';
            stroke = '#fff';
          } else if (entity.kind === 'food') {
            fill = '#8bd25a';
            stroke = '#6a4';
          } else if (entity.kind === 'bot') {
            if (isCollisionTinted) {
              fill = isCollisionActive ? '#f44' : '#44f';
              stroke = isCollisionActive ? '#f88' : '#88f';
            } else {
              fill = '#4a4';
              stroke = '#6c6';
            }
          }

          return (
            <circle
              key={`entity-${entity.eid}`}
              cx={toScreenX(entity.x, centerX, tileSize, width)}
              cy={toScreenY(entity.y, centerY, tileSize, height)}
              r={radius}
              data-inspector-kind={entity.kind}
              fill={fill}
              fillOpacity={isCollisionTinted ? collidedOpacity : 1}
              stroke={stroke}
              strokeOpacity={isCollisionTinted ? collidedOpacity : 1}
              strokeWidth={1.5}
            />
          );
        })}
      </g>
    </svg>
  );
}
