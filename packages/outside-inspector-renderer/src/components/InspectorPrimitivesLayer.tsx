import React from 'react';
import type { InspectorFrame } from '../frame';

const COLLIDED_COOLDOWN_MAX = 2;
const ARROW_SCALE = 1;
const ARROW_HEAD_LEN = 8;
const ARROW_HEAD_HALF_W = 4;
const VECTOR_BLUE = '#1e90ff';
const HERO_PATH_YELLOW = '#fc0';
const Z_VECTOR_YELLOW = '#ffd400';

export interface InspectorPrimitivesLayerProps {
  frame: InspectorFrame;
  tileSize: number;
  toScreenX: (worldX: number) => number;
  toScreenY: (worldY: number) => number;
  overlayMode?: boolean;
  showTiles?: boolean;
  showFollowLinks?: boolean;
  showVelocityVectors?: boolean;
  showCollisionTint?: boolean;
  showWallOutlines?: boolean;
  showPathfindingPaths?: boolean;
  showPhysicsShapes?: boolean;
}

/**
 * Draws inspector tiles, follow links, velocity vectors, and entities on the current SVG coordinate space.
 */
export function InspectorPrimitivesLayer({
  frame,
  tileSize,
  toScreenX,
  toScreenY,
  overlayMode = false,
  showTiles = true,
  showFollowLinks = true,
  showVelocityVectors = true,
  showCollisionTint = true,
  showWallOutlines = true,
  showPathfindingPaths = false,
  showPhysicsShapes = false,
}: InspectorPrimitivesLayerProps) {
  const tiles = frame.tiles ?? [];
  const entities = frame.entities ?? [];
  const followLinks = frame.followLinks ?? [];
  const pathfindingPaths = frame.pathfindingPaths ?? [];

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
                fill={overlayMode ? 'none' : wallCollided ? '#6af' : tile.kind === 'wall' ? '#888' : '#2f2f2f'}
                fillOpacity={overlayMode ? 1 : fillOpacity}
                stroke={showWallOutlines ? (wallCollided ? '#6af' : tile.kind === 'wall' ? '#b5b5b5' : '#555') : 'none'}
                strokeWidth={showWallOutlines ? (overlayMode ? 1.25 : 1) : 0}
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
              stroke={VECTOR_BLUE}
              strokeWidth={1}
              strokeOpacity={0.8}
            />
          ))}
        </g>
      ) : null}
      {showPathfindingPaths ? (
        <g aria-hidden="true" data-inspector-layer="pathfinding-paths">
          {pathfindingPaths.map((path) => {
            if (!Array.isArray(path.points) || path.points.length < 2) return null;
            const points = path.points.map((p) => `${toScreenX(p.x)},${toScreenY(p.y)}`).join(' ');
            const isOrderedPath = path.style === 'ordered';
            const stroke = isOrderedPath ? HERO_PATH_YELLOW : VECTOR_BLUE;
            const dash = isOrderedPath ? '4 2' : '4 3';
            const checkpoints = Array.isArray(path.checkpoints) ? path.checkpoints : [];
            const halfTile = tileSize * 0.5;
            const quarterTile = tileSize * 0.25;
            return (
              <g key={`path-${path.eid}`}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={1.5}
                  strokeOpacity={0.9}
                  strokeDasharray={dash}
                />
                {isOrderedPath
                  ? checkpoints.map((checkpoint, index) => (
                      <rect
                        key={`path-${path.eid}-checkpoint-${index}`}
                        x={toScreenX(checkpoint.x) - quarterTile}
                        y={toScreenY(checkpoint.y) - quarterTile}
                        width={halfTile}
                        height={halfTile}
                        fill="none"
                        stroke={HERO_PATH_YELLOW}
                        strokeWidth={1}
                        strokeOpacity={0.8}
                      />
                    ))
                  : null}
              </g>
            );
          })}
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
                  stroke={VECTOR_BLUE}
                  strokeWidth={1.5}
                  strokeOpacity={0.9}
                />
                <polygon
                  points={arrowPoints}
                  fill={overlayMode ? 'none' : VECTOR_BLUE}
                  fillOpacity={overlayMode ? 1 : 0.9}
                  stroke={VECTOR_BLUE}
                  strokeWidth={overlayMode ? 1.25 : 0}
                  strokeOpacity={0.9}
                />
              </g>
            );
          })}
        </g>
      ) : null}
      <g aria-hidden="true" data-inspector-layer="z-lift-vectors">
        {entities.map((entity) => {
          if (!entity.isAirborne || entity.zLiftTiles <= 0.01) return null;
          const cx = toScreenX(entity.x);
          const floorY = toScreenY(entity.y);
          const topY = floorY - entity.zLiftTiles * tileSize * 2.5;
          return (
            <line
              key={`zlift-${entity.eid}`}
              x1={cx}
              y1={floorY}
              x2={cx}
              y2={topY}
              stroke={Z_VECTOR_YELLOW}
              strokeWidth={3}
              strokeOpacity={0.95}
            />
          );
        })}
      </g>
      <g aria-hidden="true">
        {entities.map((entity) => {
          const radius = (entity.diameter * tileSize) / 2;
          const isCollisionTinted = showCollisionTint && entity.inCollidedCooldown;
          const collidedOpacity = entity.collidedTicksRemaining / COLLIDED_COOLDOWN_MAX;
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
              fill = '#44f';
              stroke = '#6af';
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
              fill={overlayMode ? 'none' : fill}
              fillOpacity={overlayMode ? 1 : isCollisionTinted ? collidedOpacity : 1}
              stroke={stroke}
              strokeOpacity={isCollisionTinted ? collidedOpacity : 1}
              strokeWidth={overlayMode ? 2 : 1.5}
            />
          );
        })}
      </g>
      <g aria-hidden="true" data-inspector-layer="target-pace-labels">
        {entities
          .filter((entity) => entity.kind === 'bot' && entity.targetPaceLabel != null)
          .map((entity) => {
            const radius = (entity.diameter * tileSize) / 2;
            return (
              <text
                key={`pace-${entity.eid}`}
                x={toScreenX(entity.x) + radius + 3}
                y={toScreenY(entity.y) - radius - 3}
                fill="#ffe26a"
                stroke="#111"
                strokeWidth={0.8}
                paintOrder="stroke"
                fontFamily="monospace"
                fontSize={Math.max(8, tileSize * 0.45)}
              >
                {entity.targetPaceLabel}
              </text>
            );
          })}
      </g>
      {showPhysicsShapes || entities.some((entity) => entity.isAirborne) ? (
        <g aria-hidden="true" data-inspector-layer="physics-shapes">
          {showPhysicsShapes
            ? tiles
            .filter((tile) => tile.kind === 'wall')
            .map((tile) => {
              const sizePx = tile.size * tileSize;
              const left = toScreenX(tile.x);
              const top = toScreenY(tile.y + tile.size);
              return (
                <rect
                  key={`physics-wall-${tile.eid}`}
                  x={left}
                  y={top}
                  width={sizePx}
                  height={sizePx}
                  fill="none"
                  stroke={VECTOR_BLUE}
                  strokeOpacity={0.95}
                  strokeWidth={1.25}
                  strokeDasharray="2 2"
                />
              );
            })
            : null}
          {entities
            .filter((entity) => showPhysicsShapes || entity.isAirborne)
            .map((entity) => {
            if (entity.physicsShape === 'box') {
              const side = entity.physicsDiameter * tileSize;
              return (
                <rect
                  key={`physics-food-${entity.eid}`}
                  x={toScreenX(entity.x) - side / 2}
                  y={toScreenY(entity.y) - side / 2}
                  width={side}
                  height={side}
                  fill="none"
                  stroke={VECTOR_BLUE}
                  strokeOpacity={0.95}
                  strokeWidth={1.25}
                  strokeDasharray="2 2"
                />
              );
            }
            const radius = (entity.physicsDiameter * tileSize) / 2;
            return (
              <circle
                key={`physics-body-${entity.eid}`}
                cx={toScreenX(entity.x)}
                cy={toScreenY(entity.y)}
                r={radius}
                fill="none"
                stroke={VECTOR_BLUE}
                strokeOpacity={0.95}
                strokeWidth={1.25}
                strokeDasharray="2 2"
              />
            );
          })}
        </g>
      ) : null}
    </>
  );
}
