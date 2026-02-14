import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Follow,
  FollowStopRange,
  FollowTarget,
  FollowTightness,
  Hero,
  ShootIntent,
  FoodCanon,
  TargetDirection,
  Pointer,
  DefaultSpriteKey,
  Direction,
  TargetPace,
  Wait,
  Wander,
  TARGET_PACE_RUNNING,
  TARGET_PACE_RUNNING_FAST,
  TARGET_PACE_STANDING_STILL,
  TARGET_PACE_WALKING,
  TARGET_PACE_WALKING_SLOW,
  addComponent,
  addEntity,
  hasComponent,
  clearEntityPath,
  clearPointerTile,
  configurePhysics3dTuning,
  getComponent,
  getPathfindingDebugPaths as getSimulatorPathfindingDebugPaths,
  orderEntityToTile,
  Position,
  RENDER_SNAPSHOT_COMPONENTS,
  removeComponent,
  removeEntity,
  resolveEntityAt,
  setPointerSpriteKey as setPointerSpriteKeyInSimulation,
  setPointerWorld as setPointerWorldInSimulation,
  setComponent,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  debugJumpPulse,
  getViewportFollowTarget,
  setViewportFollowTarget,
  query,
  runTics,
  type PathfindingDebugPath,
  type Physics3dRuntimeMode,
  type Physics3dTuning,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import type { TestPlayerSpawnFn, TestPlayerSpawnOptions } from './types';

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
  spawnOptions?: TestPlayerSpawnOptions;
  physics3dRuntimeMode?: Physics3dRuntimeMode;
  physics3dTuning?: Partial<Physics3dTuning>;
  ticsPerSecond: number;
  spawnFn: TestPlayerSpawnFn;
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
  orderFocusedEntityToTile: (
    tileX: number,
    tileY: number
  ) => {
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
  setFocusedEntityFollowPoint: (
    worldX: number,
    worldY: number
  ) => {
    updated: boolean;
    reason?: 'not-dynamic' | 'missing-world' | 'mode-disabled' | 'missing-anchor';
  };
  setFocusedEntityTargetDirection: (
    x: number,
    y: number
  ) => {
    updated: boolean;
    targetEid: number | null;
    reason?:
      | 'not-dynamic'
      | 'missing-world'
      | 'no-follow-target'
      | 'focus-target-not-commandable'
      | 'invalid-direction';
  };
  clearFocusedEntityTargetDirection: () => {
    cleared: boolean;
    targetEid: number | null;
    reason?: 'not-dynamic' | 'missing-world' | 'no-follow-target';
  };
  setZooActorsFollowPoint: (worldX: number, worldY: number) => void;
  setPointerWorld: (worldX: number, worldY: number) => void;
  setPointerSpriteKey: (spriteKey: string) => void;
  pickPointerVariantAtTile: (
    tileX: number,
    tileY: number
  ) => {
    picked: boolean;
    spriteKey?: string;
    reason?: 'missing-world' | 'not-pointer-tile';
  };
  clearPointer: () => void;
  clearFocusedEntityFollowPoint: () => void;
  isFocusedEntityMouseFollowModeEnabled: () => boolean;
  triggerHeroShoot: () => {
    triggered: boolean;
    targetEid: number | null;
    reason?: 'not-dynamic' | 'missing-world' | 'no-follow-target' | 'no-canon';
  };
  triggerDebugJump: () => {
    applied: number;
    targetEid: number | null;
    bodyYBefore?: number;
    bodyVyBefore?: number;
    bodyYAfter?: number;
    bodyVyAfter?: number;
    reason?: 'not-dynamic' | 'missing-world' | 'no-follow-target';
  };
  triggerZooActorJump: (mode: 'random' | 'all' | 'sequence') => {
    applied: number;
    jumpedEids: number[];
    reason?: 'not-dynamic' | 'missing-world' | 'no-zoo-actors';
  };
  ensureControllerHeroActor: () => {
    activated: boolean;
    heroEid: number | null;
    reason?: 'not-dynamic' | 'missing-world' | 'no-actors';
  };
  cycleControllerHeroActor: (direction: 'previous' | 'next') => {
    switched: boolean;
    heroEid: number | null;
    reason?: 'not-dynamic' | 'missing-world' | 'no-actors' | 'single-actor';
  };
  getEntityCount: () => {
    total: number;
  };
}

const ZOO_ROTATION_PERIOD_SEC = 3;
const ZOO_JUMP_PERIOD_SEC = 2;
const TWO_PI = Math.PI * 2;
const SOUTH_DIRECTION_RAD = Math.PI / 2;
const ZOO_CLICK_SEQUENCE_STEP_SEC = 0.2;

function targetPaceForZooPace(pace: 'walkSlow' | 'walk' | 'run' | 'runFast' | undefined): number {
  if (pace === 'walkSlow') return TARGET_PACE_WALKING_SLOW;
  if (pace === 'runFast') return TARGET_PACE_RUNNING_FAST;
  if (pace === 'run') return TARGET_PACE_RUNNING;
  return TARGET_PACE_WALKING;
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
    if (DefaultSpriteKey.value[eid]?.startsWith('ui.cursor.')) continue;
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

function shouldApplyZooAct(options: DynamicScenarioStreamOptions): boolean {
  return options.spawnOptions?.actorSelection != null;
}

function controllerActorCandidates(world: SimulatorWorld): number[] {
  return Array.from(query(world, [DefaultSpriteKey, Position]))
    .filter((eid) => {
      const spriteKey = DefaultSpriteKey.value[eid];
      return typeof spriteKey === 'string' && spriteKey.startsWith('actor.');
    })
    .sort((a, b) => {
      const ax = Position.x[a] ?? 0;
      const bx = Position.x[b] ?? 0;
      if (ax !== bx) return ax - bx;
      const ay = Position.y[a] ?? 0;
      const by = Position.y[b] ?? 0;
      if (ay !== by) return ay - by;
      return a - b;
    });
}

function applyZooTimedAct(
  world: SimulatorWorld,
  options: DynamicScenarioStreamOptions,
  tic: number,
  pointerWorld: { x: number; y: number } | null
): void {
  if (!shouldApplyZooAct(options)) return;
  const actorAct = options.spawnOptions?.actorAct;
  if (
    actorAct !== 'rotate' &&
    actorAct !== 'jump' &&
    actorAct !== 'follow' &&
    actorAct !== 'follow-mouse'
  ) {
    return;
  }
  const actorEids = query(world, [DefaultSpriteKey, Direction, Position]);
  const zooActorEids = actorEids.filter((eid) => DefaultSpriteKey.value[eid] === 'actor.bot');
  if (zooActorEids.length === 0) return;
  if (actorAct === 'rotate') {
    const ticsPerRotation = Math.max(
      1,
      Math.round(options.ticsPerSecond * ZOO_ROTATION_PERIOD_SEC)
    );
    const normalized = (tic % ticsPerRotation) / ticsPerRotation;
    const angle = SOUTH_DIRECTION_RAD + normalized * TWO_PI;
    for (let i = 0; i < zooActorEids.length; i++) {
      const eid = zooActorEids[i];
      setComponent(world, eid, Direction, { angle });
    }
    return;
  }

  if (actorAct === 'follow') {
    if (pointerWorld == null) return;
    for (let i = 0; i < zooActorEids.length; i++) {
      const eid = zooActorEids[i];
      const x = Position.x[eid];
      const y = Position.y[eid];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const angle = Math.atan2(pointerWorld.y - y, pointerWorld.x - x);
      if (!Number.isFinite(angle)) continue;
      setComponent(world, eid, Direction, { angle });
    }
    return;
  }

  if (actorAct === 'follow-mouse') {
    if (pointerWorld == null) return;
    const movingPace = targetPaceForZooPace(options.spawnOptions?.actorPace);
    for (let i = 0; i < zooActorEids.length; i++) {
      const eid = zooActorEids[i];
      removeComponent(world, eid, Wait);
      removeComponent(world, eid, Wander);
      removeComponent(world, eid, Follow);
      removeComponent(world, eid, FollowTarget);
      removeComponent(world, eid, FollowTightness);
      const x = Position.x[eid];
      const y = Position.y[eid];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const dx = pointerWorld.x - x;
      const dy = pointerWorld.y - y;
      const dist = Math.hypot(dx, dy);
      const stopRange = Math.max(0, getComponent(world, eid, FollowStopRange)?.tiles ?? 2);
      const angle = Math.atan2(dy, dx);
      if (Number.isFinite(angle)) {
        setComponent(world, eid, Direction, { angle });
      }
      setComponent(world, eid, TargetPace, {
        value: dist > stopRange ? movingPace : TARGET_PACE_STANDING_STILL,
      });
    }
    return;
  }

  const ticsPerJump = Math.max(1, Math.round(options.ticsPerSecond * ZOO_JUMP_PERIOD_SEC));
  if (tic % ticsPerJump !== 0) return;
  for (let i = 0; i < zooActorEids.length; i++) {
    debugJumpPulse(world, undefined, zooActorEids[i]);
  }
}

/**
 * Produces simulator render-stream packets for one scenario.
 * Dynamic mode emits snapshot then per-tick deltas; static mode emits snapshot only.
 */
export function useScenarioRenderStream(options: ScenarioStreamOptions): ScenarioStreamState {
  const [packetState, setPacketState] = useState<{
    packet: SharedRenderStreamPacket | null;
    packetVersion: number;
  }>({
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
  const controllerInjectedHeroEidsRef = useRef<Set<number>>(new Set());
  const snapshotRef = useRef<ReturnType<typeof createSnapshotSerializer> | null>(null);
  const observerRef = useRef<ReturnType<typeof createRenderObserverSerializer> | null>(null);
  const ticRef = useRef(0);
  const zooFollowPointRef = useRef<{ x: number; y: number } | null>(null);
  const pendingPointerWorldRef = useRef<{ x: number; y: number } | null>(null);
  const zooJumpSequenceRef = useRef<{
    remainingEids: number[];
    nextTic: number;
    stepTics: number;
  } | null>(null);

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
        options.spawnOptions?.ballCount ?? '',
        options.spawnOptions?.ballBounciness ?? '',
        options.spawnOptions?.actorSelection ?? '',
        options.spawnOptions?.actorAct ?? '',
        options.spawnOptions?.actorPace ?? '',
        options.spawnOptions?.pointerVariant ?? '',
        options.physics3dRuntimeMode ?? 'lua',
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
    zooFollowPointRef.current = null;
  }

  useEffect(() => {
    const world =
      options.mode === 'dynamic'
        ? createWorld({
            seed: options.seed,
            ticDurationMs: 1000 / Math.max(1, options.ticsPerSecond),
            physics3dRuntimeMode: options.physics3dRuntimeMode,
          })
        : createWorld({
            seed: options.seed,
            ticDurationMs: 50,
          });
    if (options.mode === 'dynamic') {
      configurePhysics3dTuning(world, options.physics3dTuning ?? {});
      options.spawnFn(world, options.seed, options.botCount, options.spawnOptions);
      snapshotRef.current = createSnapshotSerializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
      observerRef.current = createRenderObserverSerializer(world);
    } else {
      options.buildWorld(world, options.seed);
      snapshotRef.current = createSnapshotSerializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
      observerRef.current = null;
    }

    worldRef.current = world;
    if (pendingPointerWorldRef.current) {
      const pending = pendingPointerWorldRef.current;
      setPointerWorldInSimulation(world, pending.x, pending.y);
    }
    focusedFollowModeRef.current = {
      enabled: false,
      targetEid: null,
      anchorEid: null,
    };
    controllerInjectedHeroEidsRef.current.clear();
    ticRef.current = 0;
    zooJumpSequenceRef.current = null;
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
    if (options.mode !== 'dynamic') return;
    const world = worldRef.current;
    if (!world) return;
    configurePhysics3dTuning(world, options.physics3dTuning ?? {});
  }, [
    options.mode,
    options.mode === 'dynamic' ? options.physics3dTuning?.botKickBaseImpulse : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.botKickSpeedFactor : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.ballKickLiftBase : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.ballKickLiftBouncinessFactor : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.ballMaxHorizontalSpeed : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.ballGroundRestitution : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.ballActorRestitution : null,
    options.mode === 'dynamic' ? options.physics3dTuning?.ballBallRestitution : null,
    streamKey,
  ]);

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
        applyZooTimedAct(world, options, ticRef.current, zooFollowPointRef.current);
        const sequence = zooJumpSequenceRef.current;
        if (sequence && sequence.remainingEids.length > 0 && ticRef.current >= sequence.nextTic) {
          const nextEid = sequence.remainingEids.shift();
          if (nextEid != null) {
            debugJumpPulse(world, undefined, nextEid);
          }
          sequence.nextTic += sequence.stepTics;
          if (sequence.remainingEids.length === 0) {
            zooJumpSequenceRef.current = null;
          }
        }
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

  const emitImmediatePacket = (): void => {
    const world = worldRef.current;
    if (!world) return;

    const packet: SharedRenderStreamPacket | null =
      options.mode === 'dynamic'
        ? (() => {
            const observer = observerRef.current;
            if (!observer) return null;
            return {
              kind: 'delta' as const,
              buffer: observer(),
              tic: ticRef.current,
            };
          })()
        : (() => {
            const snapshot = snapshotRef.current;
            if (!snapshot) return null;
            return {
              kind: 'snapshot' as const,
              buffer: snapshot(),
              tic: ticRef.current,
            };
          })();

    if (!packet) return;
    setPacketState((prev) => ({
      packet,
      packetVersion: prev.packetVersion + 1,
    }));

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
  };

  const setControllerHeroActor = (world: SimulatorWorld, nextHeroEid: number): void => {
    const previousHeroEid = getViewportFollowTarget(world);
    const injectedSet = controllerInjectedHeroEidsRef.current;

    if (focusedFollowModeRef.current.enabled) {
      disableFocusedEntityMouseFollow(world);
    }

    if (previousHeroEid != null && previousHeroEid > 0 && previousHeroEid !== nextHeroEid) {
      if (query(world, [TargetDirection]).includes(previousHeroEid)) {
        removeComponent(world, previousHeroEid, TargetDirection);
      }
    }

    if (
      previousHeroEid != null &&
      previousHeroEid > 0 &&
      previousHeroEid !== nextHeroEid &&
      injectedSet.has(previousHeroEid)
    ) {
      removeComponent(world, previousHeroEid, Hero);
      injectedSet.delete(previousHeroEid);
    }

    if (!query(world, [Hero]).includes(nextHeroEid)) {
      addComponent(world, nextHeroEid, Hero);
      injectedSet.add(nextHeroEid);
    }

    setViewportFollowTarget(world, nextHeroEid);
  };

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
    setFocusedEntityTargetDirection: (x: number, y: number) => {
      if (options.mode !== 'dynamic') {
        return { updated: false, targetEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { updated: false, targetEid: null, reason: 'missing-world' as const };
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { updated: false, targetEid: null, reason: 'invalid-direction' as const };
      }
      const targetEid = getViewportFollowTarget(world);
      if (targetEid == null || targetEid <= 0) {
        return { updated: false, targetEid: null, reason: 'no-follow-target' as const };
      }
      if (!query(world, [Hero]).includes(targetEid)) {
        return {
          updated: false,
          targetEid,
          reason: 'focus-target-not-commandable' as const,
        };
      }
      const magnitude = Math.hypot(x, y);
      if (!Number.isFinite(magnitude)) {
        return { updated: false, targetEid, reason: 'invalid-direction' as const };
      }
      if (magnitude < 0.001) {
        if (query(world, [TargetDirection]).includes(targetEid)) {
          removeComponent(world, targetEid, TargetDirection);
        }
        return { updated: true, targetEid };
      }
      clearEntityPath(world, targetEid);
      if (!query(world, [TargetDirection]).includes(targetEid)) {
        addComponent(world, targetEid, TargetDirection);
      }
      setComponent(world, targetEid, TargetDirection, {
        x: x / magnitude,
        y: y / magnitude,
        magnitude: Math.min(1, magnitude),
      });
      return { updated: true, targetEid };
    },
    clearFocusedEntityTargetDirection: () => {
      if (options.mode !== 'dynamic') {
        return { cleared: false, targetEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { cleared: false, targetEid: null, reason: 'missing-world' as const };
      }
      const targetEid = getViewportFollowTarget(world);
      if (targetEid == null || targetEid <= 0) {
        return { cleared: false, targetEid: null, reason: 'no-follow-target' as const };
      }
      if (query(world, [TargetDirection]).includes(targetEid)) {
        removeComponent(world, targetEid, TargetDirection);
      }
      return { cleared: true, targetEid };
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
    setZooActorsFollowPoint: (worldX: number, worldY: number) => {
      if (options.mode !== 'dynamic') return;
      if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return;
      zooFollowPointRef.current = { x: worldX, y: worldY };
    },
    setPointerWorld: (worldX: number, worldY: number) => {
      if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return;
      pendingPointerWorldRef.current = { x: worldX, y: worldY };
      const world = worldRef.current;
      if (!world) return;
      setPointerWorldInSimulation(world, worldX, worldY);
      emitImmediatePacket();
    },
    setPointerSpriteKey: (spriteKey: string) => {
      const world = worldRef.current;
      if (!world) return;
      setPointerSpriteKeyInSimulation(world, spriteKey);
      emitImmediatePacket();
    },
    pickPointerVariantAtTile: (tileX: number, tileY: number) => {
      const world = worldRef.current;
      if (!world) {
        return { picked: false, reason: 'missing-world' as const };
      }
      const tx = Math.floor(tileX);
      const ty = Math.floor(tileY);
      const pointerEids = new Set(query(world, [Pointer]));
      const pointerVariantEid = query(world, [Position, DefaultSpriteKey]).find((eid) => {
        if (pointerEids.has(eid)) return false;
        const spriteKey = DefaultSpriteKey.value[eid];
        if (typeof spriteKey !== 'string' || !spriteKey.startsWith('ui.cursor.')) return false;
        const x = Position.x[eid];
        const y = Position.y[eid];
        if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
        return Math.floor(x) === tx && Math.floor(y) === ty;
      });
      if (pointerVariantEid == null) {
        return { picked: false, reason: 'not-pointer-tile' as const };
      }
      const spriteKey = DefaultSpriteKey.value[pointerVariantEid];
      if (typeof spriteKey !== 'string') {
        return { picked: false, reason: 'not-pointer-tile' as const };
      }
      setPointerSpriteKeyInSimulation(world, spriteKey);
      emitImmediatePacket();
      return { picked: true, spriteKey };
    },
    clearPointer: () => {
      pendingPointerWorldRef.current = null;
      const world = worldRef.current;
      if (!world) return;
      clearPointerTile(world);
      emitImmediatePacket();
    },
    isFocusedEntityMouseFollowModeEnabled: () => focusedFollowModeRef.current.enabled,
    triggerHeroShoot: () => {
      if (options.mode !== 'dynamic') {
        return { triggered: false, targetEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { triggered: false, targetEid: null, reason: 'missing-world' as const };
      }
      const targetEid = getViewportFollowTarget(world);
      if (targetEid == null) {
        return { triggered: false, targetEid: null, reason: 'no-follow-target' as const };
      }
      if (!hasComponent(world, targetEid, FoodCanon)) {
        return { triggered: false, targetEid, reason: 'no-canon' as const };
      }
      setComponent(world, targetEid, ShootIntent, { value: 1 });
      return { triggered: true, targetEid };
    },
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
    triggerZooActorJump: (mode: 'random' | 'all' | 'sequence') => {
      if (options.mode !== 'dynamic') {
        return { applied: 0, jumpedEids: [], reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { applied: 0, jumpedEids: [], reason: 'missing-world' as const };
      }
      const actorEids = Array.from(query(world, [DefaultSpriteKey])).filter(
        (eid) => DefaultSpriteKey.value[eid] === 'actor.bot'
      );
      if (actorEids.length === 0) {
        return { applied: 0, jumpedEids: [], reason: 'no-zoo-actors' as const };
      }

      if (mode === 'all') {
        let applied = 0;
        for (let i = 0; i < actorEids.length; i++) {
          applied += debugJumpPulse(world, undefined, actorEids[i]);
        }
        return {
          applied,
          jumpedEids: actorEids,
        };
      }

      if (mode === 'sequence') {
        const orderedEids = [...actorEids].sort((a, b) => {
          const ax = Position.x[a] ?? 0;
          const bx = Position.x[b] ?? 0;
          if (ax !== bx) return ax - bx;
          const ay = Position.y[a] ?? 0;
          const by = Position.y[b] ?? 0;
          return ay - by;
        });
        const stepTics = Math.max(
          1,
          Math.round(options.ticsPerSecond * ZOO_CLICK_SEQUENCE_STEP_SEC)
        );
        zooJumpSequenceRef.current = {
          remainingEids: orderedEids,
          nextTic: ticRef.current,
          stepTics,
        };
        return {
          applied: 0,
          jumpedEids: orderedEids,
        };
      }

      const randomIndex =
        Math.floor(world.random.nextFloat() * actorEids.length) % actorEids.length;
      const eid = actorEids[randomIndex];
      const applied = debugJumpPulse(world, undefined, eid);
      return {
        applied,
        jumpedEids: [eid],
      };
    },
    ensureControllerHeroActor: () => {
      if (options.mode !== 'dynamic') {
        return { activated: false, heroEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { activated: false, heroEid: null, reason: 'missing-world' as const };
      }
      const actorEids = controllerActorCandidates(world);
      if (actorEids.length === 0) {
        return { activated: false, heroEid: null, reason: 'no-actors' as const };
      }
      const currentTarget = getViewportFollowTarget(world);
      const selectedHeroEid =
        currentTarget != null && currentTarget > 0 && actorEids.includes(currentTarget)
          ? currentTarget
          : actorEids[0];
      const hadHeroAlready = query(world, [Hero]).includes(selectedHeroEid);
      const targetWasAlreadySelected = currentTarget === selectedHeroEid;
      if (!(hadHeroAlready && targetWasAlreadySelected)) {
        setControllerHeroActor(world, selectedHeroEid);
        emitImmediatePacket();
      }
      return {
        activated: !(hadHeroAlready && targetWasAlreadySelected),
        heroEid: selectedHeroEid,
      };
    },
    cycleControllerHeroActor: (direction: 'previous' | 'next') => {
      if (options.mode !== 'dynamic') {
        return { switched: false, heroEid: null, reason: 'not-dynamic' as const };
      }
      const world = worldRef.current;
      if (!world) {
        return { switched: false, heroEid: null, reason: 'missing-world' as const };
      }
      const actorEids = controllerActorCandidates(world);
      if (actorEids.length === 0) {
        return { switched: false, heroEid: null, reason: 'no-actors' as const };
      }
      if (actorEids.length === 1) {
        const onlyEid = actorEids[0];
        setControllerHeroActor(world, onlyEid);
        emitImmediatePacket();
        return { switched: false, heroEid: onlyEid, reason: 'single-actor' as const };
      }

      const currentTarget = getViewportFollowTarget(world);
      const currentIndex = actorEids.indexOf(currentTarget);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const delta = direction === 'previous' ? -1 : 1;
      const nextIndex = (startIndex + delta + actorEids.length) % actorEids.length;
      const nextHeroEid = actorEids[nextIndex];
      setControllerHeroActor(world, nextHeroEid);
      emitImmediatePacket();
      return { switched: nextHeroEid !== currentTarget, heroEid: nextHeroEid };
    },
    getEntityCount: () => {
      const world = worldRef.current;
      if (!world) return { total: 0 };
      // Count all entities in the world by checking the entityMap
      const entityMap = (world as any).entityMap as Map<number, any> | number[];
      let totalCount = 0;
      if (entityMap instanceof Map) {
        totalCount = entityMap.size;
      } else if (Array.isArray(entityMap)) {
        totalCount = entityMap.filter((e) => e != null).length;
      }
      return { total: totalCount };
    },
  };
}
