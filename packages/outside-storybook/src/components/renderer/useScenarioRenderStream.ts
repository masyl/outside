import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Position,
  RENDER_SNAPSHOT_COMPONENTS,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  getViewportFollowTarget,
  query,
  runTics,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import type { SpawnFn } from '../simulator/useSimulatorWorld';

export type SharedRenderStreamPacket = {
  kind: 'snapshot' | 'delta';
  buffer: ArrayBuffer;
  tic: number;
};

export interface StreamBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface BaseScenarioStreamOptions {
  seed: number;
}

interface DynamicScenarioStreamOptions extends BaseScenarioStreamOptions {
  mode: 'dynamic';
  botCount: number;
  spawnOptions?: {
    botCount?: number;
    foodCount?: number;
    dogCount?: number;
    catCount?: number;
  };
  ticsPerSecond: number;
  spawnFn: SpawnFn;
}

interface StaticScenarioStreamOptions extends BaseScenarioStreamOptions {
  mode: 'static';
  buildWorld: (world: SimulatorWorld, seed: number) => void;
}

export type ScenarioStreamOptions = DynamicScenarioStreamOptions | StaticScenarioStreamOptions;

export interface ScenarioStreamState {
  packet: SharedRenderStreamPacket | null;
  packetVersion: number;
  bounds: StreamBounds;
  center: { x: number; y: number };
  streamKey: string;
}

function computeBounds(world: SimulatorWorld): StreamBounds {
  const entities = query(world, [Position]);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const x = Position.x[eid];
    const y = Position.y[eid];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  return { minX, maxX, minY, maxY };
}

function centerFromBounds(bounds: StreamBounds): { x: number; y: number } {
  return {
    x: (bounds.minX + bounds.maxX) / 2 + 0.5,
    y: (bounds.minY + bounds.maxY) / 2 + 0.5,
  };
}

function centerFromWorld(world: SimulatorWorld, bounds: StreamBounds): { x: number; y: number } {
  const focusEid = getViewportFollowTarget(world);
  if (focusEid != null) {
    const x = Position.x[focusEid];
    const y = Position.y[focusEid];
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { x, y };
    }
  }
  return centerFromBounds(bounds);
}

/**
 * Produces simulator render-stream packets for one scenario.
 * Dynamic mode emits snapshot then per-tick deltas; static mode emits snapshot only.
 */
export function useScenarioRenderStream(options: ScenarioStreamOptions): ScenarioStreamState {
  const [packetState, setPacketState] = useState<{ packet: SharedRenderStreamPacket | null; packetVersion: number }>({
    packet: null,
    packetVersion: 0,
  });
  const [bounds, setBounds] = useState<StreamBounds>({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const [center, setCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const worldRef = useRef<SimulatorWorld | null>(null);
  const observerRef = useRef<ReturnType<typeof createRenderObserverSerializer> | null>(null);
  const snapshotRef = useRef<ReturnType<typeof createSnapshotSerializer> | null>(null);
  const positionCountRef = useRef(0);
  const ticRef = useRef(0);

  const streamKey = useMemo(() => {
    if (options.mode === 'dynamic') {
      return [
        'dynamic',
        options.seed,
        options.botCount,
        options.ticsPerSecond,
        options.spawnFn.name,
        options.spawnOptions?.foodCount ?? '',
        options.spawnOptions?.dogCount ?? '',
        options.spawnOptions?.catCount ?? '',
      ].join(':');
    }
    return `static:${options.seed}:${options.buildWorld.name}`;
  }, [options]);

  useEffect(() => {
    const world =
      options.mode === 'dynamic'
        ? createWorld({
            seed: options.seed,
            ticDurationMs: 1000 / Math.max(1, options.ticsPerSecond),
          })
        : createWorld({ seed: options.seed, ticDurationMs: 50 });
    if (options.mode === 'dynamic') {
      options.spawnFn(world, options.seed, options.botCount, options.spawnOptions);
      observerRef.current = createRenderObserverSerializer(world);
      snapshotRef.current = createSnapshotSerializer(world, RENDER_SNAPSHOT_COMPONENTS);
    } else {
      options.buildWorld(world, options.seed);
      observerRef.current = null;
      snapshotRef.current = createSnapshotSerializer(world, RENDER_SNAPSHOT_COMPONENTS);
    }

    worldRef.current = world;
    ticRef.current = 0;
    positionCountRef.current = query(world, [Position]).length;
    const snapshot = snapshotRef.current ?? createSnapshotSerializer(world, RENDER_SNAPSHOT_COMPONENTS);
    const nextBounds = computeBounds(world);
    setBounds(nextBounds);
    setCenter(centerFromWorld(world, nextBounds));

    setPacketState((prev) => ({
      packet: { kind: 'snapshot', buffer: snapshot(), tic: 0 },
      packetVersion: prev.packetVersion + 1,
    }));

  }, [streamKey]);

  useEffect(() => {
    if (options.mode !== 'dynamic') return undefined;
    if (!worldRef.current || !observerRef.current) return undefined;

    const ticMs = 1000 / Math.max(1, options.ticsPerSecond);
    let lastTime = performance.now();
    let accumulator = 0;
    let frameId = 0;
    let running = true;

    const step = (now: number) => {
      if (!running) return;
      const world = worldRef.current;
      const observer = observerRef.current;
      const snapshot = snapshotRef.current;
      if (!world || !observer || !snapshot) return;

      const deltaMs = now - lastTime;
      lastTime = now;
      accumulator += deltaMs;

      let ticsToRun = 0;
      while (accumulator >= ticMs) {
        accumulator -= ticMs;
        ticsToRun += 1;
        if (ticsToRun > 10) break;
      }

      for (let i = 0; i < ticsToRun; i++) {
        runTics(world, 1);
        ticRef.current += 1;
        const nextPositionCount = query(world, [Position]).length;
        const shouldEmitSnapshot = nextPositionCount !== positionCountRef.current;
        positionCountRef.current = nextPositionCount;
        const packet: SharedRenderStreamPacket = {
          kind: shouldEmitSnapshot ? 'snapshot' : 'delta',
          buffer: shouldEmitSnapshot ? snapshot() : observer(),
          tic: ticRef.current,
        };
        setPacketState((prev) => ({
          packet,
          packetVersion: prev.packetVersion + 1,
        }));
      }
      if (ticsToRun > 0) {
        const nextBounds = computeBounds(world);
        setBounds((prev) =>
          prev.minX === nextBounds.minX &&
          prev.maxX === nextBounds.maxX &&
          prev.minY === nextBounds.minY &&
          prev.maxY === nextBounds.maxY
            ? prev
            : nextBounds
        );
        setCenter((prev) => {
          const next = centerFromWorld(world, nextBounds);
          return prev.x === next.x && prev.y === next.y ? prev : next;
        });
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [streamKey, options.mode === 'dynamic' ? options.ticsPerSecond : null]);

  return {
    packet: packetState.packet,
    packetVersion: packetState.packetVersion,
    bounds,
    center,
    streamKey,
  };
}
