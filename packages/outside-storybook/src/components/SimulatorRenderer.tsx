import {
  getComponent,
  query,
  addComponent,
  removeComponent,
  removeEntity,
  Position,
  Obstacle,
  Walkable,
  Hero,
  setPointerTile,
  getPointerTile,
  clearPointerTile,
  resolveEntityAt,
  getViewportFollowTarget,
  setViewportFollowTarget,
  spawnFloorTile,
  orderHeroTo,
  getHeroPath,
} from '@outside/simulator';
import type { ResolveEntityKind } from '@outside/simulator';
import { useCallback, useMemo } from 'react';
import { useSimulatorWorld, type SpawnFn } from './simulator/useSimulatorWorld';
import {
  spawnScatteredWithLeaders,
  createFloorRectSpawn,
  createFloorRectWithHeroSpawn,
  createMetaTileDungeonSpawn,
} from './simulator/spawnCloud';
import {
  SimulatorViewport,
  SimulatorCaption,
  buildInspectorFrame,
  FloorTilesLayer,
  GridOverlay,
  InspectorPrimitivesLayer,
} from '@outside/inspector-renderer';

/** Logical size of the SVG viewBox (4x zoom-out vs original 400×300) */
const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 1200;
const PIXELS_PER_TILE = 20;
/** Viewport bounds in world coordinates (for grid/floor clipping) */
const VIEW_WORLD = {
  xMin: -VIEWBOX_WIDTH / 2 / PIXELS_PER_TILE,
  xMax: VIEWBOX_WIDTH / 2 / PIXELS_PER_TILE,
  yMin: -VIEWBOX_HEIGHT / 2 / PIXELS_PER_TILE,
  yMax: VIEWBOX_HEIGHT / 2 / PIXELS_PER_TILE,
};

interface SimulatorRendererProps {
  seed?: number;
  ticsPerSecond?: number;
  /** Number of entities to spawn */
  entityCount?: number;
  /** Optional custom spawn function (e.g. spawnFollowChain for follow-chain demo). */
  spawnFn?: SpawnFn;
  /** When 'floorRect', use createFloorRectSpawn(roomWidth, roomHeight). When 'floorRectWithHero', use floor rect + hero. When 'metaTileDungeon', use MetaTile dungeon. */
  spawnPreset?: 'floorRect' | 'floorRectWithHero' | 'metaTileDungeon';
  /** Room width in tiles (used when spawnPreset is 'floorRect'). Default 60. */
  roomWidth?: number;
  /** Room height in tiles (used when spawnPreset is 'floorRect'). Default 40. */
  roomHeight?: number;
  /** MetaTile grid width (used when spawnPreset is 'metaTileDungeon'). Default 5. */
  metaWidth?: number;
  /** MetaTile grid height (used when spawnPreset is 'metaTileDungeon'). Default 5. */
  metaHeight?: number;
  /** Optional legend for caption. */
  captionLegend?: string;
  /** Zoom level (1 = default, >1 = zoom in, <1 = zoom out). */
  zoom?: number;
}

/**
 * React + SVG renderer for the headless ECS simulator.
 * Composes useSimulatorWorld (tick loop, state) with presentational Viewport, Entity, and Caption.
 * Draws follow lines (blue) and velocity arrows (orange) when applicable.
 */
/** Convert viewBox coordinates to world tile using current view center. */
function viewBoxToTile(
  viewBoxX: number,
  viewBoxY: number,
  viewCenterX: number,
  viewCenterY: number
): { x: number; y: number } {
  const worldX = viewCenterX + (viewBoxX - VIEWBOX_WIDTH / 2) / PIXELS_PER_TILE;
  const worldY = viewCenterY - (viewBoxY - VIEWBOX_HEIGHT / 2) / PIXELS_PER_TILE;
  return { x: Math.floor(worldX), y: Math.floor(worldY) };
}

export function SimulatorRenderer({
  seed = 42,
  ticsPerSecond = 10,
  entityCount = 5,
  spawnFn,
  spawnPreset,
  roomWidth = 60,
  roomHeight = 40,
  metaWidth = 5,
  metaHeight = 5,
  captionLegend,
  zoom = 1,
}: SimulatorRendererProps) {
  const resolvedSpawnFn = useMemo<SpawnFn>(
    () =>
      spawnPreset === 'floorRectWithHero'
        ? createFloorRectWithHeroSpawn(roomWidth, roomHeight)
        : spawnPreset === 'floorRect'
          ? createFloorRectSpawn(roomWidth, roomHeight)
          : spawnPreset === 'metaTileDungeon'
            ? createMetaTileDungeonSpawn(metaWidth, metaHeight)
            : (spawnFn ?? spawnScatteredWithLeaders),
    [spawnPreset, roomWidth, roomHeight, metaWidth, metaHeight, spawnFn]
  );
  const { world, entityIds, seed: stateSeed, invalidate } =
    useSimulatorWorld(seed, entityCount, ticsPerSecond, resolvedSpawnFn);

  const followEid = world ? getViewportFollowTarget(world) : 0;
  const viewCenter = world && followEid
    ? getComponent(world, followEid, Position)
    : { x: 0, y: 0 };
  const viewCenterX = viewCenter?.x ?? 0;
  const viewCenterY = viewCenter?.y ?? 0;

  const toX = useCallback(
    (x: number) => VIEWBOX_WIDTH / 2 + (x - viewCenterX) * PIXELS_PER_TILE,
    [viewCenterX]
  );
  const toY = useCallback(
    (y: number) => VIEWBOX_HEIGHT / 2 - (y - viewCenterY) * PIXELS_PER_TILE,
    [viewCenterY]
  );
  const transform = { toX, toY };

  const handlePointerMove = useCallback(
    (viewBoxX: number, viewBoxY: number) => {
      if (!world) return;
      const { x: tx, y: ty } = viewBoxToTile(
        viewBoxX,
        viewBoxY,
        viewCenterX,
        viewCenterY
      );
      setPointerTile(world, tx, ty);
      invalidate();
    },
    [world, viewCenterX, viewCenterY, invalidate]
  );

  const handlePointerLeave = useCallback(() => {
    if (!world) return;
    clearPointerTile(world);
    invalidate();
  }, [world, invalidate]);

  const handlePointerDown = useCallback(
    (viewBoxX: number, viewBoxY: number) => {
      if (!world) return;
      const { x: tx, y: ty } = viewBoxToTile(
        viewBoxX,
        viewBoxY,
        viewCenterX,
        viewCenterY
      );
      const resolved = resolveEntityAt(world, tx, ty);
      const heroEids = new Set(query(world, [Hero]));
      if (
        followEid &&
        heroEids.has(followEid) &&
        resolved.kind === 'floor'
      ) {
        orderHeroTo(world, followEid, tx, ty);
        invalidate();
        return;
      }
      if (resolved.kind === 'empty') {
        spawnFloorTile(world, tx, ty, true);
      } else if (resolved.kind === 'floor' && resolved.eid != null) {
        removeComponent(world, resolved.eid, Walkable);
        addComponent(world, resolved.eid, Obstacle);
      } else if (resolved.kind === 'wall' && resolved.eid != null) {
        removeEntity(world, resolved.eid);
      } else if (resolved.kind === 'bot' && resolved.eid != null) {
        setViewportFollowTarget(world, resolved.eid);
      }
      invalidate();
    },
    [world, followEid, viewCenterX, viewCenterY, invalidate]
  );

  const pointerTile = world ? getPointerTile(world) : { x: NaN, y: NaN };
  const pointerVisible =
    Number.isFinite(pointerTile.x) && Number.isFinite(pointerTile.y);
  const resolved =
    world && pointerVisible
      ? resolveEntityAt(world, pointerTile.x, pointerTile.y)
      : { kind: 'empty' as ResolveEntityKind };
  const pointerCursor =
    pointerVisible && resolved.kind !== 'empty' ? 'pointer' : 'default';

  if (!world) {
    return <div>Loading...</div>;
  }
  const inspectorFrame = buildInspectorFrame(world);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <SimulatorViewport
        viewBoxWidth={VIEWBOX_WIDTH}
        viewBoxHeight={VIEWBOX_HEIGHT}
        zoom={zoom}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        cursor={pointerCursor}
      >
        {/* Floor tiles (dark grey squares, under grid and entities) */}
        <FloorTilesLayer
          world={world}
          transform={transform}
          pixelsPerTile={PIXELS_PER_TILE}
        />
        {/* Grid lines (viewport-clipped; floorTiles 30% white solid, subPositionSnap 10% dotted) */}
        <GridOverlay world={world} bounds={VIEW_WORLD} transform={transform} />
        <InspectorPrimitivesLayer
          frame={inspectorFrame}
          tileSize={PIXELS_PER_TILE}
          toScreenX={toX}
          toScreenY={toY}
          showTiles={false}
        />
        {/* Hero path: dotted yellow line and yellow outlined checkpoints (50% tile) for followed hero */}
        {followEid &&
          (() => {
            const path = getHeroPath(world, followEid);
            if (path.length === 0) return null;
            const followPos = getComponent(world, followEid, Position);
            const points: { x: number; y: number }[] = [
              { x: followPos.x, y: followPos.y },
              ...path.map((w) => ({ x: w.x + 0.5, y: w.y + 0.5 })),
            ];
            const halfTile = PIXELS_PER_TILE * 0.5;
            const quarterTile = PIXELS_PER_TILE * 0.25;
            return (
              <g pointerEvents="none">
                {points.length >= 2 && (
                  <polyline
                    points={points
                      .map((p) => `${toX(p.x)},${toY(p.y)}`)
                      .join(' ')}
                    fill="none"
                    stroke="#fc0"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    strokeOpacity={0.9}
                  />
                )}
                {path.map((w, i) => (
                  <rect
                    key={i}
                    x={toX(w.x + 0.5) - quarterTile}
                    y={toY(w.y + 0.5) - quarterTile}
                    width={halfTile}
                    height={halfTile}
                    fill="none"
                    stroke="#fc0"
                    strokeWidth={1}
                    strokeOpacity={0.8}
                  />
                ))}
              </g>
            );
          })()}
        {/* Pointer tile highlight when hovering: default 50% dotted; floor/wall 100% dotted; bot solid green */}
        {pointerVisible &&
          (() => {
            const tx = pointerTile.x;
            const ty = pointerTile.y;
            const rx = toX(tx);
            const ry = toY(ty + 1);
            const isBot = resolved.kind === 'bot';
            const opacity = resolved.kind === 'empty' ? 0.5 : 1;
            return (
              <rect
                x={rx}
                y={ry}
                width={PIXELS_PER_TILE}
                height={PIXELS_PER_TILE}
                fill={isBot ? '#4a4' : 'none'}
                fillOpacity={isBot ? 0.4 : 0}
                stroke="white"
                strokeOpacity={opacity}
                strokeWidth={1}
                strokeDasharray={isBot ? 'none' : '4 2'}
                pointerEvents="none"
              />
            );
          })()}
      </SimulatorViewport>
      <SimulatorCaption
        seed={stateSeed}
        entityCount={entityIds.length}
        legend={captionLegend}
        overlay
      />
    </div>
  );
}
