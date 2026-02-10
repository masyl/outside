import { useEffect, useRef, useState } from 'react';
import { Body, Plane, SAPBroadphase, Sphere, Vec3, World } from 'cannon-es';
import {
  Direction,
  FloorTile,
  Obstacle,
  ObstacleSize,
  Position,
  createWorld,
  query,
  setComponent,
} from '@outside/simulator';
import { spawnFloorRectThenScatteredWithSize } from '../simulator/spawnCloud';
import { countSevereWallPenetrations, createWallBodies, type DungeonWallCell } from './dungeon-physics';

const ROOM_WIDTH = 10;
const ROOM_HEIGHT = 8;
const TILE = 48;
const DEFAULT_BOT_COUNT = 6;
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

export interface PhysicsDungeonPrototypeStoryProps {
  seed?: number;
  botCount?: number;
  botMoveSpeed?: number;
  jumpImpulse?: number;
  severeClipTolerance?: number;
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

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  walls: readonly DungeonWallCell[],
  bots: readonly BotBodyState[],
  severeClips: number
): void {
  const widthPx = width * TILE;
  const heightPx = height * TILE;

  ctx.clearRect(0, 0, widthPx, heightPx);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, widthPx, heightPx);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE, 0);
    ctx.lineTo(x * TILE, heightPx);
    ctx.stroke();
  }
  for (let z = 0; z <= height; z++) {
    ctx.beginPath();
    ctx.moveTo(0, z * TILE);
    ctx.lineTo(widthPx, z * TILE);
    ctx.stroke();
  }

  ctx.fillStyle = '#475569';
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    ctx.fillRect(wall.x * TILE, wall.z * TILE, TILE, TILE);
  }

  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    const y = bot.body.position.y;
    const radius = bot.radius * TILE;
    const px = bot.body.position.x * TILE;
    const pz = bot.body.position.z * TILE;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px, pz, radius * 1.1, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    const lift = Math.max(0, y - bot.radius) * TILE;
    ctx.fillStyle = severeClips > 0 ? '#f97316' : '#22c55e';
    ctx.beginPath();
    ctx.arc(px, pz - lift, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function PhysicsDungeonPrototypeStory({
  seed = 42,
  botCount = DEFAULT_BOT_COUNT,
  botMoveSpeed = 2.2,
  jumpImpulse = 2.4,
  severeClipTolerance = 0.03,
}: PhysicsDungeonPrototypeStoryProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    simSeconds: 0,
    currentSevereClips: 0,
    maxSevereClips: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rng = createRng(seed);
    const world = new World({ gravity: new Vec3(0, -25, 0) });
    world.broadphase = new SAPBroadphase(world);
    world.allowSleep = true;

    const simWorld = createWorld({ seed, ticDurationMs: 50 });
    spawnFloorRectThenScatteredWithSize(simWorld, seed, botCount, ROOM_WIDTH, ROOM_HEIGHT);

    const floor = new Body({ mass: 0 });
    floor.addShape(new Plane());
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floor);

    const wallEids = [...query(simWorld, [Position, FloorTile, Obstacle])];
    const walls: DungeonWallCell[] = wallEids.map((eid) => ({
      x: Math.floor(Position.x[eid]),
      z: Math.floor(Position.y[eid]),
    }));
    const wallBodies = createWallBodies(world, walls);

    const wallCellKeys = new Set<string>(walls.map((w) => key(w.x, w.z)));
    const floorEids = [...query(simWorld, [Position, FloorTile])];
    const freeCells = floorEids
      .map((eid) => ({ x: Math.floor(Position.x[eid]), z: Math.floor(Position.y[eid]) }))
      .filter((cell) => !wallCellKeys.has(key(cell.x, cell.z)));

    const botEids = [...query(simWorld, [Position, ObstacleSize, Direction])];
    const bots: BotBodyState[] = [];
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
      world.addBody(body);

      bots.push({ eid, body, radius });

      const target = randomFreeCell(rng, freeCells);
      controls.set(eid, {
        nextJumpAt: 0.7 + rng() * 1.4,
        targetX: target.x + 0.5,
        targetZ: target.z + 0.5,
      });
    }

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

      while (accumulator >= FIXED_STEP) {
        accumulator -= FIXED_STEP;
        simSeconds += FIXED_STEP;

        for (let i = 0; i < bots.length; i++) {
          const botState = bots[i];
          const control = controls.get(botState.eid);
          if (!control) continue;

          const dx = control.targetX - botState.body.position.x;
          const dz = control.targetZ - botState.body.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.35) {
            const target = randomFreeCell(rng, freeCells);
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

        world.step(FIXED_STEP);

        for (let i = 0; i < bots.length; i++) {
          const botState = bots[i];
          setComponent(simWorld, botState.eid, Position, {
            x: botState.body.position.x,
            y: botState.body.position.z,
          });

          const vx = botState.body.velocity.x;
          const vz = botState.body.velocity.z;
          if (Math.hypot(vx, vz) > 0.05) {
            setComponent(simWorld, botState.eid, Direction, {
              angle: Math.atan2(vz, vx),
            });
          }
        }
      }

      const severeClips = countSevereWallPenetrations(
        bots.map((b) => b.body),
        wallBodies,
        severeClipTolerance
      );
      if (severeClips > maxSevereClips) {
        maxSevereClips = severeClips;
      }

      drawScene(ctx, ROOM_WIDTH, ROOM_HEIGHT, walls, bots, severeClips);

      if (nowMs - lastUiUpdateMs > 120) {
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
  }, [seed, botCount, botMoveSpeed, jumpImpulse, severeClipTolerance]);

  return (
    <div style={{ display: 'grid', gap: 12, padding: 12, background: '#020617', color: '#e2e8f0' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
        <div>Prototype: Cannon 3D physics (top-down projection)</div>
        <div>Mode: ECS-backed entities (walls and bots sourced from @outside/simulator).</div>
        <div>Objective: verify sphere-vs-wall box collision prevents wall clipping.</div>
        <div>Sim time: {metrics.simSeconds.toFixed(1)}s</div>
        <div>Current severe wall clips: {metrics.currentSevereClips}</div>
        <div>Max severe wall clips observed: {metrics.maxSevereClips}</div>
        <div>
          Params: seed={seed} bots={botCount} speed={botMoveSpeed.toFixed(1)} jump=
          {jumpImpulse.toFixed(1)} tol={severeClipTolerance.toFixed(2)}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={ROOM_WIDTH * TILE}
        height={ROOM_HEIGHT * TILE}
        style={{
          width: ROOM_WIDTH * TILE,
          height: ROOM_HEIGHT * TILE,
          border: '1px solid #334155',
          imageRendering: 'pixelated',
          background: '#0f172a',
        }}
      />
    </div>
  );
}
