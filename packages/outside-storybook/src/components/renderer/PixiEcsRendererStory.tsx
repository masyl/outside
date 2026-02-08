import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Application } from 'pixi.js';
import {
  createWorld,
  runTics,
  createRenderObserverSerializer,
  Position,
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

function computeBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const count = Position.x.length;
  for (let eid = 0; eid < count; eid++) {
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

  const setupSimulation = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) {
      console.log('[PixiEcsRendererStory] renderer not ready');
      return;
    }

    renderer.setTileSize(tileSize);
    renderer.setDebugEnabled(showDebug);

    const world = createWorld({ seed, ticDurationMs: 50 });
    const observer = createRenderObserverSerializer(world);
    spawnFn(world, seed, entityCount);
    worldRef.current = world;
    observerRef.current = observer;
    ticRef.current = 0;

    if (waitForAssets && renderer.getAssetsReady()) {
      await renderer.getAssetsReady();
    }
    renderer.applyStream({
      kind: 'delta',
      buffer: observer(),
      tic: ticRef.current,
    });

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
    setupSimulation();
    setRendererReady((v) => v + 1);
  }, [setupSimulation, tileSize, showDebug]);

  useEffect(() => {
    void setupSimulation();
  }, [setupSimulation]);

  useEffect(() => {
    if (!worldRef.current || !observerRef.current || !rendererRef.current) return;
    const world = worldRef.current;
    const observer = observerRef.current;
    const renderer = rendererRef.current;
    const ticDurationMs = world.ticDurationMs;
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
      while (accumulator >= ticDurationMs) {
        accumulator -= ticDurationMs;
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
      onResize={() => rendererRef.current?.recenter()}
    >
      {initRenderer}
    </PixiContainerWrapper>
  );
}
