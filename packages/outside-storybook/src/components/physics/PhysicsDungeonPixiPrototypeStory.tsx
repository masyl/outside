import { useCallback, useEffect, useRef, useState } from 'react';
import { Body, Plane, SAPBroadphase, Sphere, Vec3, World } from 'cannon-es';
import type { Application } from 'pixi.js';
import { PixiEcsRenderer } from '@outside/renderer';
import {
  Direction,
  FloorTile,
  Obstacle,
  ObstacleSize,
  Position,
  RENDER_SNAPSHOT_COMPONENTS,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  query,
  setComponent,
  type SimulatorWorld,
} from '@outside/simulator';
import { spawnFloorRectThenScatteredWithSize } from '../simulator/spawnCloud';
import { PixiContainerWrapper } from '../wrappers/PixiContainerWrapper';
import { countSevereWallPenetrations, createWallBodies, type DungeonWallCell } from './dungeon-physics';

const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 8;
const DEFAULT_BOT_COUNT = 6;
const DEFAULT_TILE_SIZE = 24;
const DEFAULT_BOT_RADIUS = 0.3;
const FIXED_STEP = 1 / 120;

interface Metrics {
  simSeconds: number;
  currentSevereClips: number;
  maxSevereClips: number;
}

interface BotControl {
  nextJumpAt: number;
  targetX: number;
  targetZ: number;
}

interface BotBodyState {
  eid: number;
  body: Body;
  radius: number;
}

export interface PhysicsDungeonPixiPrototypeStoryProps {
  seed?: number;
  botCount?: number;
  botMoveSpeed?: number;
  jumpImpulse?: number;
  severeClipTolerance?: number;
  tileSize?: number;
}

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function key(x: number, z: number): string {
  return `${x},${z}`;
}

function randomFreeCell(rng: () => number, cells: readonly DungeonWallCell[]): DungeonWallCell {
  const idx = Math.floor(rng() * cells.length) % cells.length;
  return cells[Math.max(0, idx)];
}

function createPhysicsState(
  seed: number,
  botCount: number
): {
  simWorld: SimulatorWorld;
  physicsWorld: World;
  botBodies: BotBodyState[];
  wallBodies: Body[];
  freeCells: DungeonWallCell[];
  controls: Map<number, BotControl>;
  center: { x: number; y: number };
  observer: ReturnType<typeof createRenderObserverSerializer>;
  snapshot: ReturnType<typeof createSnapshotSerializer>;
} {
  const rng = createRng(seed);
  const simWorld = createWorld({ seed, ticDurationMs: 50 });
  spawnFloorRectThenScatteredWithSize(simWorld, seed, botCount, ROOM_WIDTH, ROOM_HEIGHT);

  const physicsWorld = new World({ gravity: new Vec3(0, -25, 0) });
  physicsWorld.broadphase = new SAPBroadphase(physicsWorld);
  physicsWorld.allowSleep = true;

  const floor = new Body({ mass: 0 });
  floor.addShape(new Plane());
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  physicsWorld.addBody(floor);

  const wallEids = [...query(simWorld, [Position, FloorTile, Obstacle])];
  const walls: DungeonWallCell[] = wallEids.map((eid) => ({
    x: Math.floor(Position.x[eid]),
    z: Math.floor(Position.y[eid]),
  }));
  const wallBodies = createWallBodies(physicsWorld, walls);

  const wallCellKeys = new Set<string>(walls.map((w) => key(w.x, w.z)));
  const floorEids = [...query(simWorld, [Position, FloorTile])];
  const freeCells = floorEids
    .map((eid) => ({ x: Math.floor(Position.x[eid]), z: Math.floor(Position.y[eid]) }))
    .filter((cell) => !wallCellKeys.has(key(cell.x, cell.z)));

  const botEids = [...query(simWorld, [Position, ObstacleSize, Direction])];
  const botBodies: BotBodyState[] = [];
  const controls = new Map<number, BotControl>();

  for (let i = 0; i < botEids.length; i++) {
    const eid = botEids[i];
    const radius = Math.max(0.15, (ObstacleSize.diameter[eid] || DEFAULT_BOT_RADIUS * 2) * 0.5);
    const body = new Body({
      mass: 1,
      linearDamping: 0.25,
      angularDamping: 0.9,
    });
    body.addShape(new Sphere(radius));
    body.position.set(Position.x[eid], radius, Position.y[eid]);
    physicsWorld.addBody(body);
    botBodies.push({ eid, body, radius });

    const target = randomFreeCell(rng, freeCells);
    controls.set(eid, {
      nextJumpAt: 0.7 + rng() * 1.4,
      targetX: target.x + 0.5,
      targetZ: target.z + 0.5,
    });
  }

  const allTiles = [...query(simWorld, [Position, FloorTile])];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < allTiles.length; i++) {
    const eid = allTiles[i];
    minX = Math.min(minX, Position.x[eid]);
    maxX = Math.max(maxX, Position.x[eid]);
    minY = Math.min(minY, Position.y[eid]);
    maxY = Math.max(maxY, Position.y[eid]);
  }

  const center = Number.isFinite(minX)
    ? { x: (minX + maxX) / 2 + 0.5, y: (minY + maxY) / 2 + 0.5 }
    : { x: 0, y: 0 };

  return {
    simWorld,
    physicsWorld,
    botBodies,
    wallBodies,
    freeCells,
    controls,
    center,
    observer: createRenderObserverSerializer(simWorld),
    snapshot: createSnapshotSerializer(simWorld, RENDER_SNAPSHOT_COMPONENTS),
  };
}

export function PhysicsDungeonPixiPrototypeStory({
  seed = 42,
  botCount = DEFAULT_BOT_COUNT,
  botMoveSpeed = 2.2,
  jumpImpulse = 2.4,
  severeClipTolerance = 0.03,
  tileSize = DEFAULT_TILE_SIZE,
}: PhysicsDungeonPixiPrototypeStoryProps): JSX.Element {
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const rendererAppRef = useRef<Application | null>(null);
  const [rendererReady, setRendererReady] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({
    simSeconds: 0,
    currentSevereClips: 0,
    maxSevereClips: 0,
  });

  const initRenderer = useCallback(
    (app: Application) => {
      if (rendererRef.current && rendererAppRef.current === app) return;
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      const renderer = new PixiEcsRenderer(app, { tileSize });
      rendererRef.current = renderer;
      rendererAppRef.current = app;
      void renderer.loadAssets();
      setRendererReady((v) => v + 1);
    },
    [tileSize]
  );

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || rendererReady === 0) return;

    const rng = createRng(seed);
    const state = createPhysicsState(seed, botCount);
    let tic = 0;

    renderer.resetWorld();
    renderer.setTileSize(tileSize);
    renderer.setViewCenter(state.center.x, state.center.y);
    renderer.applyStream({ kind: 'snapshot', buffer: state.snapshot(), tic });

    let raf = 0;
    let simSeconds = 0;
    let accumulator = 0;
    let lastMs = performance.now();
    let maxSevereClips = 0;
    let lastUiUpdateMs = 0;

    const step = () => {
      const nowMs = performance.now();
      const frameSec = Math.min(0.05, (nowMs - lastMs) / 1000);
      lastMs = nowMs;
      accumulator += frameSec;

      let ranSteps = 0;
      while (accumulator >= FIXED_STEP) {
        accumulator -= FIXED_STEP;
        simSeconds += FIXED_STEP;
        ranSteps += 1;

        for (let i = 0; i < state.botBodies.length; i++) {
          const botState = state.botBodies[i];
          const control = state.controls.get(botState.eid);
          if (!control) continue;

          const dx = control.targetX - botState.body.position.x;
          const dz = control.targetZ - botState.body.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.35) {
            const target = randomFreeCell(rng, state.freeCells);
            control.targetX = target.x + 0.5;
            control.targetZ = target.z + 0.5;
          } else {
            const desiredX = (dx / Math.max(dist, 0.0001)) * botMoveSpeed;
            const desiredZ = (dz / Math.max(dist, 0.0001)) * botMoveSpeed;
            const impulseX = (desiredX - botState.body.velocity.x) * 0.08;
            const impulseZ = (desiredZ - botState.body.velocity.z) * 0.08;
            botState.body.applyImpulse(new Vec3(impulseX, 0, impulseZ));
          }

          if (simSeconds >= control.nextJumpAt && botState.body.position.y <= botState.radius + 0.03) {
            botState.body.applyImpulse(new Vec3(0, jumpImpulse, 0));
            control.nextJumpAt = simSeconds + 1 + rng() * 2;
          }
        }

        state.physicsWorld.step(FIXED_STEP);

        for (let i = 0; i < state.botBodies.length; i++) {
          const botState = state.botBodies[i];
          setComponent(state.simWorld, botState.eid, Position, {
            x: botState.body.position.x,
            y: botState.body.position.z,
          });

          const vx = botState.body.velocity.x;
          const vz = botState.body.velocity.z;
          if (Math.hypot(vx, vz) > 0.05) {
            setComponent(state.simWorld, botState.eid, Direction, {
              angle: Math.atan2(vz, vx),
            });
          }
        }

        tic += 1;
        renderer.applyStream({
          kind: 'delta',
          buffer: state.observer(),
          tic,
        });
      }

      const severeClips = countSevereWallPenetrations(
        state.botBodies.map((b) => b.body),
        state.wallBodies,
        severeClipTolerance
      );
      if (severeClips > maxSevereClips) {
        maxSevereClips = severeClips;
      }

      if (ranSteps > 0 && nowMs - lastUiUpdateMs > 120) {
        setMetrics({
          simSeconds,
          currentSevereClips: severeClips,
          maxSevereClips,
        });
        lastUiUpdateMs = nowMs;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rendererReady, seed, botCount, botMoveSpeed, jumpImpulse, severeClipTolerance, tileSize]);

  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererAppRef.current = null;
    };
  }, []);

  const handleResize = useCallback((_app: Application, nextWidth: number, nextHeight: number) => {
    rendererRef.current?.setViewportSize(nextWidth, nextHeight);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PixiContainerWrapper
        instanceKey="physics-dungeon-pixi"
        width="100%"
        height="100%"
        backgroundColor={0x0b0d12}
        onResize={handleResize}
      >
        {initRenderer}
      </PixiContainerWrapper>

      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '8px 10px',
          background: 'rgba(2, 6, 23, 0.85)',
          border: '1px solid #334155',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        <div>Prototype: Cannon 3D physics + Pixi renderer stream</div>
        <div>Sim time: {metrics.simSeconds.toFixed(1)}s</div>
        <div>Current severe wall clips: {metrics.currentSevereClips}</div>
        <div>Max severe wall clips observed: {metrics.maxSevereClips}</div>
        <div>
          Params: seed={seed} bots={botCount} speed={botMoveSpeed.toFixed(1)} jump=
          {jumpImpulse.toFixed(1)} tol={severeClipTolerance.toFixed(2)} tile={tileSize}
        </div>
      </div>
    </div>
  );
}
