import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Application } from 'pixi.js';
import {
  createWorld,
  runTics,
  createRenderObserverSerializer,
  createSnapshotSerializer,
  RENDER_COMPONENTS,
  Position,
  query,
} from '@outside/simulator';
import { PixiEcsRenderer } from '@outside/renderer';
import type { SpawnFn } from '../simulator/useSimulatorWorld';
import { PixiContainerWrapper } from '../wrappers/PixiContainerWrapper';

interface PixiEcsRendererStoryProps {
  seed: number;
  ticsPerSecond: number;
  entityCount: number;
  spawnFn: SpawnFn;
  width?: number;
  height?: number;
  tileSize?: number;
  showDebug?: boolean;
  waitForAssets?: boolean;
}

export function PixiEcsRendererStory({
  seed,
  ticsPerSecond,
  entityCount,
  spawnFn,
  width = 900,
  height = 700,
  tileSize = 16,
  showDebug = false,
  waitForAssets = false,
}: PixiEcsRendererStoryProps) {
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const worldRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const observerRef = useRef<ReturnType<typeof createRenderObserverSerializer> | null>(null);
  const ticRef = useRef(0);
  const [rendererReady, setRendererReady] = useState(0);
  const worldRefForBounds = useRef<ReturnType<typeof createWorld> | null>(null);

  const computeBounds = useCallback((): { minX: number; maxX: number; minY: number; maxY: number } => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const world = worldRefForBounds.current;
    if (!world) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const entities = query(world, [Position]);
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const x = Position.x[eid];
      const y = Position.y[eid];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX)) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    return { minX, maxX, minY, maxY };
  }, []);

  const setupSimulation = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }

    renderer.setTileSize(tileSize);
    renderer.setDebugEnabled(showDebug);
    renderer.resetWorld();

    const world = createWorld({ seed, ticDurationMs: 50 });
    const observer = createRenderObserverSerializer(world);
    const snapshot = createSnapshotSerializer(world, RENDER_COMPONENTS);
    spawnFn(world, seed, entityCount);
    worldRef.current = world;
    worldRefForBounds.current = world;
    observerRef.current = observer;
    ticRef.current = 0;

    if (waitForAssets && renderer.getAssetsReady()) {
      await renderer.getAssetsReady();
    }
    renderer.applyStream({ kind: 'snapshot', buffer: snapshot(), tic: ticRef.current });
    renderer.applyStream({ kind: 'delta', buffer: observer(), tic: ticRef.current });

    const bounds = computeBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2 + 0.5;
    const centerY = (bounds.minY + bounds.maxY) / 2 + 0.5;
    renderer.setViewCenter(centerX, centerY);
  }, [seed, entityCount, spawnFn, tileSize, showDebug, waitForAssets]);

  const initRenderer = useCallback((app: Application) => {
    const renderer = new PixiEcsRenderer(app, {
      tileSize,
      debugEnabled: showDebug,
    });
    rendererRef.current = renderer;
    void renderer.loadAssets();
    setRendererReady((v) => v + 1);
  }, [tileSize, showDebug]);

  useEffect(() => {
    if (rendererReady === 0) return;
    void setupSimulation();
  }, [setupSimulation, rendererReady]);

  useEffect(() => {
    if (!worldRef.current || !observerRef.current || !rendererRef.current) return;
    const world = worldRef.current;
    const observer = observerRef.current;
    const renderer = rendererRef.current;
    const ticMs = 1000 / Math.max(1, ticsPerSecond);
    let lastTime = performance.now();
    let accumulator = 0;
    let frameId = 0;
    let running = true;

    const step = (now: number) => {
      if (!running) return;
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
        const delta = observer();
        ticRef.current += 1;
        renderer.applyStream({
          kind: 'delta',
          buffer: delta,
          tic: ticRef.current,
        });
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [ticsPerSecond, rendererReady]);

  return (
    <PixiContainerWrapper
      width={width}
      height={height}
      backgroundColor={0x0b0d12}
      onResize={(_app, nextWidth, nextHeight) => {
        rendererRef.current?.setViewportSize(nextWidth, nextHeight);
      }}
    >
      {initRenderer}
    </PixiContainerWrapper>
  );
}
