import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addComponent,
  addEntity,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  createWorld,
  DefaultSpriteKey,
  Direction,
  Observed,
  Position,
  RENDER_SNAPSHOT_COMPONENTS,
  removeEntity,
  setComponent,
} from '@outside/simulator';
import type { SharedRenderStreamPacket } from './use-scenario-render-stream';

const TICKS_PER_SECOND = 8;
// Direction π/2 = south (facing toward viewer, idle default)
const SOUTH_DIRECTION_RAD = Math.PI / 2;
// Fullscreen entity lives at world x=0; heroes at x=-1, -2, ... going left.
const FULLSCREEN_WORLD_X = 0;

export interface StatusBarStreamState {
  packet: SharedRenderStreamPacket | null;
  packetVersion: number;
  /** Current number of hero slots in the status bar world. */
  heroCount: number;
  /**
   * Syncs the status bar world to the provided hero sprite keys.
   * Heroes are placed at world x=-1, -2, … going left from the fullscreen entity.
   * Pass an empty array to clear all heroes.
   */
  syncHeroes: (spriteKeys: string[]) => void;
}

export function useStatusBarStream(): StatusBarStreamState {
  const worldRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const snapshotRef = useRef<(() => ArrayBuffer) | null>(null);
  const observerRef = useRef<(() => ArrayBuffer) | null>(null);
  const heroEidsRef = useRef<number[]>([]);
  const ticRef = useRef(0);

  const [heroCount, setHeroCount] = useState(0);
  const [packetState, setPacketState] = useState<{
    packet: SharedRenderStreamPacket | null;
    packetVersion: number;
  }>({ packet: null, packetVersion: 0 });

  // Create world once on mount.
  useEffect(() => {
    const world = createWorld({ seed: 0, ticDurationMs: 1000 / TICKS_PER_SECOND });

    const serializer = createSnapshotSerializer(world, [...RENDER_SNAPSHOT_COMPONENTS]);
    const observer = createRenderObserverSerializer(world);

    // Fullscreen entity at x=0, y=0 — rightmost visible tile.
    const fullscreenEid = addEntity(world);
    addComponent(world, fullscreenEid, Observed);
    addComponent(world, fullscreenEid, Position);
    setComponent(world, fullscreenEid, Position, { x: FULLSCREEN_WORLD_X, y: 0 });
    addComponent(world, fullscreenEid, DefaultSpriteKey);
    setComponent(world, fullscreenEid, DefaultSpriteKey, { value: 'ui.status-bar.fullscreen' });
    addComponent(world, fullscreenEid, Direction);
    setComponent(world, fullscreenEid, Direction, { angle: SOUTH_DIRECTION_RAD });

    worldRef.current = world;
    snapshotRef.current = serializer;
    observerRef.current = observer;
    ticRef.current = 0;

    setPacketState((prev) => ({
      packet: { kind: 'snapshot', buffer: serializer(), tic: 0 },
      packetVersion: prev.packetVersion + 1,
    }));

    return () => {
      worldRef.current = null;
      snapshotRef.current = null;
      observerRef.current = null;
      heroEidsRef.current = [];
      ticRef.current = 0;
    };
  }, []);

  // Tick timer at 8 ticks/sec — drives delta emission for liveness.
  useEffect(() => {
    const tickMs = 1000 / TICKS_PER_SECOND;
    const intervalId = window.setInterval(() => {
      const snapshot = snapshotRef.current;
      const observer = observerRef.current;
      if (!snapshot || !observer) return;

      ticRef.current += 1;
      const shouldSnapshot = ticRef.current % 120 === 0;
      setPacketState((prev) => ({
        packet: {
          kind: shouldSnapshot ? 'snapshot' : 'delta',
          buffer: shouldSnapshot ? snapshot() : observer(),
          tic: ticRef.current,
        },
        packetVersion: prev.packetVersion + 1,
      }));
    }, tickMs);

    return () => window.clearInterval(intervalId);
  }, []);

  /**
   * Stable callback: updates hero entities in the status bar world.
   * Heroes at world x = -1, -2, … (going left from fullscreen at x=0).
   */
  const syncHeroes = useCallback((spriteKeys: string[]) => {
    const world = worldRef.current;
    const snapshot = snapshotRef.current;
    if (!world || !snapshot) return;

    const heroEids = heroEidsRef.current;
    const newCount = spriteKeys.length;
    const prevCount = heroEids.length;

    // Add missing hero entity slots.
    for (let i = prevCount; i < newCount; i++) {
      const eid = addEntity(world);
      addComponent(world, eid, Observed);
      addComponent(world, eid, Position);
      setComponent(world, eid, Position, { x: -(i + 1), y: 0 });
      addComponent(world, eid, DefaultSpriteKey);
      setComponent(world, eid, DefaultSpriteKey, { value: spriteKeys[i] });
      addComponent(world, eid, Direction);
      setComponent(world, eid, Direction, { angle: SOUTH_DIRECTION_RAD });
      heroEids.push(eid);
    }

    // Remove excess hero entity slots.
    while (heroEids.length > newCount) {
      const eid = heroEids.pop()!;
      removeEntity(world, eid);
    }

    // Update sprite keys for existing slots.
    for (let i = 0; i < Math.min(newCount, prevCount); i++) {
      setComponent(world, heroEids[i], DefaultSpriteKey, { value: spriteKeys[i] });
    }

    if (prevCount !== newCount) {
      setHeroCount(newCount);
    }

    // Emit a full snapshot so the renderer sees the layout change immediately.
    ticRef.current += 1;
    setPacketState((prev) => ({
      packet: { kind: 'snapshot', buffer: snapshot(), tic: ticRef.current },
      packetVersion: prev.packetVersion + 1,
    }));
  }, []);

  return {
    packet: packetState.packet,
    packetVersion: packetState.packetVersion,
    heroCount,
    syncHeroes,
  };
}
