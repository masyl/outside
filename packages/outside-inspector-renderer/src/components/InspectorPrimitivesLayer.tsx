import React from 'react';
import type { InspectorFrame } from '../frame';

const COLLIDED_COOLDOWN_MAX = 2;
const ARROW_SCALE = 1;
const ARROW_HEAD_LEN = 8;
const ARROW_HEAD_HALF_W = 4;

export interface InspectorPrimitivesLayerProps {
  frame: InspectorFrame;
  tileSize: number;
  toScreenX: (worldX: number) => number;
  toScreenY: (worldY: number) => number;
  showTiles?: boolean;
  showFollowLinks?: boolean;
  showVelocityVectors?: boolean;
  showCollisionTint?: boolean;
}

/**
 * Draws inspector tiles, follow links, velocity vectors, and entities on the current SVG coordinate space.
 */
export function InspectorPrimitivesLayer({
  frame,
  tileSize,
  toScreenX,
  toScreenY,
  showTiles = true,
  showFollowLinks = true,
  showVelocityVectors = true,
  showCollisionTint = true,
}: InspectorPrimitivesLayerProps) {
  const tiles = frame.tiles ?? [];
  const entities = frame.entities ?? [];
  const followLinks = frame.followLinks ?? [];

  return (
    <>
      {showTiles ? (
        <g aria-hidden="true">
          {tiles.map((tile) => {
            const sizePx = tile.size * tileSize;
            const left = toScreenX(tile.x);
            const top = toScreenY(tile.y + tile.size);
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
      ) : null}
      {showFollowLinks ? (
        <g aria-hidden="true" data-inspector-layer="follow-links">
          {followLinks.map((link) => (
            <line
              key={`follow-${link.followerEid}-${link.targetEid}`}
              x1={toScreenX(link.fromX)}
              y1={toScreenY(link.fromY)}
              x2={toScreenX(link.toX)}
              y2={toScreenY(link.toY)}
              stroke="#6af"
              strokeWidth={1}
              strokeOpacity={0.8}
            />
          ))}
        </g>
      ) : null}
      {showVelocityVectors ? (
        <g aria-hidden="true" data-inspector-layer="velocity-vectors">
          {entities.map((entity) => {
            if (entity.directionRad == null || entity.speedTilesPerSec == null) {
              return null;
            }
            const speed = entity.speedTilesPerSec;
            if (!Number.isFinite(speed) || speed <= 0) {
              return null;
            }

            const cx = toScreenX(entity.x);
            const cy = toScreenY(entity.y);
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
        {entities.map((entity) => {
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
              cx={toScreenX(entity.x)}
              cy={toScreenY(entity.y)}
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
    </>
  );
}
