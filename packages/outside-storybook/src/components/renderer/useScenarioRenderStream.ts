import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Follow,
  FollowTarget,
  FollowTightness,
  Hero,
  TargetPace,
  TARGET_PACE_STANDING_STILL,
  addComponent,
  addEntity,
  clearEntityPath,
  getPathfindingDebugPaths as getSimulatorPathfindingDebugPaths,
  orderEntityToTile,
  Position,
  RENDER_SNAPSHOT_COMPONENTS,
  removeComponent,
  removeEntity,
  resolveEntityAt,
  setComponent,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  debugJumpPulse,
  getViewportFollowTarget,
  query,
  runTics,
  type PathfindingDebugPath,
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
  getPathfindingDebugPaths: () => PathfindingDebugPath[];
  orderFocusedEntityToTile: (tileX: number, tileY: number) => {
    ordered: boolean;
    reason?:
      | 'not-dynamic'
      | 'missing-world'
      | 'no-follow-target'
      | 'focus-target-not-commandable'
      | 'focus-follow-pointer-mode'
      | 'target-not-floor';
    targetEid: number | null;
  };
  toggleFocusedEntityMouseFollowMode: () => {
    enabled: boolean;
    targetEid: number | null;
    reason?: 'not-dynamic' | 'missing-world' | 'no-follow-target' | 'focus-target-not-commandable';
  };
  setFocusedEntityFollowPoint: (worldX: number, worldY: number) => {
    updated: boolean;
    reason?: 'not-dynamic' | 'missing-world' | 'mode-disabled' | 'missing-anchor';
  };
  clearFocusedEntityFollowPoint: () => void;
  isFocusedEntityMouseFollowModeEnabled: () => boolean;
  triggerDebugJump: () => {
    applied: number;
    targetEid: number | null;
    bodyYBefore?: number;
    bodyVyBefore?: number;
    bodyYAfter?: number;
    bodyVyAfter?: number;
    reason?: 'not-dynamic' | 'missing-world' | 'no-follow-target';
  };
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
  const focusedFollowModeRef = useRef<{
    enabled: boolean;
    targetEid: number | null;
    anchorEid: number | null;
  }>({
    enabled: false,
    targetEid: null,
    anchorEid: null,
  });
  const snapshotRef = useRef<ReturnType<typeof createSnapshotSerializer> | null>(null);
  const observerRef = useRef<ReturnType<typeof createRenderObserverSerializer> | null>(null);
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

  function disableFocusedEntityMouseFollow(world: SimulatorWorld): void {
    const state = focusedFollowModeRef.current;
    const targetEid = state.targetEid;
    const anchorEid = state.anchorEid;

    if (targetEid != null && targetEid > 0) {
      removeComponent(world, targetEid, Follow);
      removeComponent(world, targetEid, FollowTarget);
      removeComponent(world, targetEid, FollowTightness);
      setComponent(world, targetEid, TargetPace, { value: TARGET_PACE_STANDING_STILL });
    }

    if (anchorEid != null && anchorEid > 0) {
      removeEntity(world, anchorEid);
    }

    focusedFollowModeRef.current = {
      enabled: false,
      targetEid: null,
      anchorEid: null,
    };
  }

  useEffect(() => {
    const world =
      options.mode === 'dynamic'
        ? createWorld({
            seed: options.seed,
            ticDurationMs: 1000 / Math.max(1, options.ticsPerSecond),
          })
        : createWorld({
            seed: options.seed,
            ticDurationMs: 50,
          });
    if (options.mode === 'dynamic') {
      options.spawnFn(world, options.seed, options.botCount, options.spawnOptions);
      snapshotRef.current = createSnapshotSerializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
      observerRef.current = createRenderObserverSerializer(world);
    } else {
      options.buildWorld(world, options.seed);
      snapshotRef.current = createSnapshotSerializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
      observerRef.current = null;
    }

    worldRef.current = world;
    focusedFollowModeRef.current = {
      enabled: false,
      targetEid: null,
      anchorEid: null,
    };
    ticRef.current = 0;
    const snapshot =
      snapshotRef.current ?? createSnapshotSerializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
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
    if (!worldRef.current) return undefined;

    const ticMs = 1000 / Math.max(1, options.ticsPerSecond);
    let lastTime = performance.now();
    let accumulator = 0;
    let frameId = 0;
    let running = true;

    const step = (now: number) => {
      if (!running) return;
      const world = worldRef.current;
      const snapshot = snapshotRef.current;
      const observer = observerRef.current;
      if (!world || !snapshot || !observer) return;

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
        const shouldEmitSnapshot = ticRef.current % 120 === 0;
        const packet: SharedRenderStreamPacket = {
          // Use per-tic deltas for low-latency playback, with periodic snapshots as authority refresh.
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
    getPathfindingDebugPaths: () => {
      if (options.mode !== 'dynamic') return [];
      const world = worldRef.current;
      if (!world) return [];
      const focusedEid = getViewportFollowTarget(world);
      return getSimulatorPathfindingDebugPaths(world, {
        focusedEid: focusedEid != null && focusedEid > 0 ? focusedEid : null,
      });
    },
    orderFocusedEntityToTile: (tileX: number, tileY: number) => {
      if (options.mode !== 'dynamic') {
        return { ordered: false, reason: 'not-dynamic' as const, targetEid: null };
      }
      const world = worldRef.current;
      if (!world) {
        return { ordered: false, reason: 'missing-world' as const, targetEid: null };
      }
      if (focusedFollowModeRef.current.enabled) {
        return {
          ordered: false,
          reason: 'focus-follow-pointer-mode' as const,
          targetEid: focusedFollowModeRef.current.targetEid,
        };
      }
      const targetEid = getViewportFollowTarget(world);
      if (targetEid == null || targetEid <= 0) {
        return { ordered: false, reason: 'no-follow-target' as const, targetEid: null };
      }
      if (!query(world, [Hero]).includes(targetEid)) {
        return {
          ordered: false,
          reason: 'focus-target-not-commandable' as const,
          targetEid,
        };
      }
      const resolved = resolveEntityAt(world, tileX, tileY);
      if (resolved.kind !== 'floor') {
        return {
          ordered: false,
          reason: 'target-not-floor' as const,
          targetEid,
        };
      }
      orderEntityToTile(world, targetEid, tileX, tileY);
      return { ordered: true, targetEid };
    },
    toggleFocusedEntityMouseFollowMode: () => {
      if (options.mode !== 'dynamic') {
        return { enabled: false, targetEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { enabled: false, targetEid: null, reason: 'missing-world' as const };
      }

      if (focusedFollowModeRef.current.enabled) {
        const targetEid = focusedFollowModeRef.current.targetEid;
        disableFocusedEntityMouseFollow(world);
        return { enabled: false, targetEid };
      }

      const targetEid = getViewportFollowTarget(world);
      if (targetEid == null || targetEid <= 0) {
        return { enabled: false, targetEid: null, reason: 'no-follow-target' as const };
      }
      if (!query(world, [Hero]).includes(targetEid)) {
        return {
          enabled: false,
          targetEid,
          reason: 'focus-target-not-commandable' as const,
        };
      }

      clearEntityPath(world, targetEid);

      const anchorEid = addEntity(world);
      addComponent(world, anchorEid, Position);
      setComponent(world, anchorEid, Position, {
        x: Position.x[targetEid],
        y: Position.y[targetEid],
      });

      addComponent(world, targetEid, Follow);
      addComponent(world, targetEid, FollowTarget);
      setComponent(world, targetEid, FollowTarget, { eid: anchorEid });

      focusedFollowModeRef.current = {
        enabled: true,
        targetEid,
        anchorEid,
      };
      return { enabled: true, targetEid };
    },
    setFocusedEntityFollowPoint: (worldX: number, worldY: number) => {
      if (options.mode !== 'dynamic') {
        return { updated: false, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { updated: false, reason: 'missing-world' as const };
      }
      const state = focusedFollowModeRef.current;
      if (!state.enabled) {
        return { updated: false, reason: 'mode-disabled' as const };
      }
      if (state.anchorEid == null || state.anchorEid <= 0) {
        return { updated: false, reason: 'missing-anchor' as const };
      }
      setComponent(world, state.anchorEid, Position, { x: worldX, y: worldY });
      return { updated: true };
    },
    clearFocusedEntityFollowPoint: () => {
      if (options.mode !== 'dynamic') return;
      const world = worldRef.current;
      if (!world) return;
      const state = focusedFollowModeRef.current;
      if (!state.enabled || state.anchorEid == null || state.targetEid == null) return;
      const tx = Position.x[state.targetEid];
      const ty = Position.y[state.targetEid];
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;
      setComponent(world, state.anchorEid, Position, { x: tx, y: ty });
    },
    isFocusedEntityMouseFollowModeEnabled: () => focusedFollowModeRef.current.enabled,
    triggerDebugJump: () => {
      if (options.mode !== 'dynamic') {
        return { applied: 0, targetEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { applied: 0, targetEid: null, reason: 'missing-world' as const };
      }
      const targetEid = getViewportFollowTarget(world);
      if (targetEid == null) {
        return { applied: 0, targetEid: null, reason: 'no-follow-target' as const };
      }
      const targetBody = world.physics3dState?.bodyByEid.get(targetEid);
      const bodyYBefore = targetBody?.position.y;
      const bodyVyBefore = targetBody?.velocity.y;
      const applied = debugJumpPulse(world, undefined, targetEid);
      const targetBodyAfter = world.physics3dState?.bodyByEid.get(targetEid);
      const bodyYAfter = targetBodyAfter?.position.y;
      const bodyVyAfter = targetBodyAfter?.velocity.y;
      return {
        applied,
        targetEid,
        bodyYBefore: Number.isFinite(bodyYBefore) ? bodyYBefore : undefined,
        bodyVyBefore: Number.isFinite(bodyVyBefore) ? bodyVyBefore : undefined,
        bodyYAfter: Number.isFinite(bodyYAfter) ? bodyYAfter : undefined,
        bodyVyAfter: Number.isFinite(bodyVyAfter) ? bodyVyAfter : undefined,
      };
    },
  };
}
