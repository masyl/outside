import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Application } from 'pixi.js';
import {
  createWorld,
  createSnapshotSerializer,
  RENDER_COMPONENTS,
  Position,
  query,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import { PixiEcsRenderer } from '@outside/renderer';
import { PixiContainerWrapper } from '../wrappers/PixiContainerWrapper';

export interface StaticPixiEcsRendererStoryProps {
  seed: number;
  width?: number;
  height?: number;
  tileSize?: number;
  showDebug?: boolean;
  waitForAssets?: boolean;
  buildWorld: (world: SimulatorWorld, seed: number) => void;
}

function computeBounds(world: SimulatorWorld): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
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
}

export function StaticPixiEcsRendererStory({
  seed,
  width = 900,
  height = 700,
  tileSize = 16,
  showDebug = false,
  waitForAssets = false,
  buildWorld,
}: StaticPixiEcsRendererStoryProps) {
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const [rendererReady, setRendererReady] = useState(0);

  const applyStaticWorld = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }

    renderer.setTileSize(tileSize);
    renderer.setDebugEnabled(showDebug);
    renderer.resetWorld();

    const world = createWorld({ seed, ticDurationMs: 50 });
    const snapshot = createSnapshotSerializer(world, RENDER_COMPONENTS);
    buildWorld(world, seed);

    if (waitForAssets && renderer.getAssetsReady()) {
      await renderer.getAssetsReady();
    }
    renderer.applyStream({ kind: 'snapshot', buffer: snapshot(), tic: 0 });

    const bounds = computeBounds(world);
    const centerX = (bounds.minX + bounds.maxX) / 2 + 0.5;
    const centerY = (bounds.minY + bounds.maxY) / 2 + 0.5;
    renderer.setViewCenter(centerX, centerY);

    const entityCount = query(world, [Position]).length;
    if (showDebug) {
      console.log('[StaticPixiEcsRenderer] snapshot applied', {
        entityCount,
        bounds,
      });
    }
  }, [seed, buildWorld, tileSize, showDebug, waitForAssets]);

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
    void applyStaticWorld();
  }, [applyStaticWorld, rendererReady]);

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
