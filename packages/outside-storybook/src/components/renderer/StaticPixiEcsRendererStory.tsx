import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Application } from 'pixi.js';
import type { SimulatorWorld } from '@outside/simulator';
import { PixiEcsRenderer } from '@outside/renderer';
import {
  InspectorOverlay,
  InspectorRenderer,
  applyInspectorStream,
  buildInspectorFrame,
  createInspectorRenderWorld,
  type InspectorFrame,
} from '@outside/inspector-renderer';
import { PixiContainerWrapper } from '../wrappers/PixiContainerWrapper';
import { useScenarioRenderStream } from './useScenarioRenderStream';
import { createStreamController } from './stream-controller';

export interface StaticPixiEcsRendererStoryProps {
  rendererVer?: string;
  inspectorVer?: string;
  seed: number;
  tileSize?: number;
  showDebug?: boolean;
  waitForAssets?: boolean;
  showInspectorOverlay?: boolean;
  buildWorld: (world: SimulatorWorld, seed: number) => void;
}

const EMPTY_FRAME: InspectorFrame = {
  tiles: [],
  entities: [],
  unknownCount: 0,
};

export function StaticPixiEcsRendererStory({
  seed,
  tileSize = 16,
  showDebug = false,
  waitForAssets = false,
  showInspectorOverlay = false,
  buildWorld,
}: StaticPixiEcsRendererStoryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const rendererAppRef = useRef<Application | null>(null);
  const inspectorWorldRef = useRef(createInspectorRenderWorld());
  const streamControllerRef = useRef(createStreamController());
  const pixiApplyQueueRef = useRef(Promise.resolve());
  const [inspectorFrame, setInspectorFrame] = useState<InspectorFrame>(EMPTY_FRAME);
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const [rendererReady, setRendererReady] = useState(0);

  const stream = useScenarioRenderStream({
    mode: 'static',
    seed,
    buildWorld,
  });

  const initRenderer = useCallback((app: Application) => {
    if (rendererRef.current && rendererAppRef.current === app) return;
    if (rendererRef.current) {
      rendererRef.current.destroy();
      rendererRef.current = null;
    }
    const renderer = new PixiEcsRenderer(app, {
      tileSize,
      debugEnabled: showDebug,
    });
    rendererRef.current = renderer;
    rendererAppRef.current = app;
    void renderer.loadAssets();
    setRendererReady((v) => v + 1);
  }, []);

  useEffect(() => {
    streamControllerRef.current.reset(stream.streamKey);
    pixiApplyQueueRef.current = Promise.resolve();
    inspectorWorldRef.current = createInspectorRenderWorld();
    setInspectorFrame(EMPTY_FRAME);
  }, [stream.streamKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || rendererReady === 0) return;
    renderer.setTileSize(tileSize);
    renderer.setDebugEnabled(showDebug);
    renderer.resetWorld();
  }, [rendererReady, tileSize, showDebug, stream.streamKey]);

  useEffect(() => {
    if (!stream.packet) {
      return;
    }
    streamControllerRef.current.push(stream.packet);
  }, [stream.packetVersion]);

  useEffect(() => {
    const unsubscribe = streamControllerRef.current.subscribe('inspector', (packet) => {
      applyInspectorStream(inspectorWorldRef.current, packet);
      const frame = buildInspectorFrame(inspectorWorldRef.current.world);
      setInspectorFrame(frame);
    });

    return () => unsubscribe();
  }, [stream.streamKey]);

  useEffect(() => {
    streamControllerRef.current.setReady('inspector', true);
    return () => {
      streamControllerRef.current.setReady('inspector', false);
    };
  }, [stream.streamKey]);

  useEffect(() => {
    const unsubscribe = streamControllerRef.current.subscribe('pixi', (packet) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      pixiApplyQueueRef.current = pixiApplyQueueRef.current.then(async () => {
        if (waitForAssets && renderer.getAssetsReady()) {
          await renderer.getAssetsReady();
        }
        renderer.applyStream({
          kind: packet.kind,
          tic: packet.tic,
          buffer: packet.buffer,
        });
      });
    });

    return () => unsubscribe();
  }, [stream.streamKey, waitForAssets]);

  useEffect(() => {
    const isPixiReady = rendererReady > 0 && rendererRef.current !== null;
    streamControllerRef.current.setReady('pixi', isPixiReady);
    return () => {
      streamControllerRef.current.setReady('pixi', false);
    };
  }, [rendererReady, stream.streamKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setViewCenter(stream.center.x, stream.center.y);
  }, [rendererReady, stream.center.x, stream.center.y, stream.streamKey]);

  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererAppRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateFromContainer = () => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      setViewportSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateFromContainer();
    const observer = new ResizeObserver(updateFromContainer);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const handleResize = useCallback((_app: Application, nextWidth: number, nextHeight: number) => {
    rendererRef.current?.setViewportSize(nextWidth, nextHeight);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PixiContainerWrapper
        instanceKey={`pixi-ecs-static-${stream.streamKey}-${tileSize}`}
        width="100%"
        height="100%"
        backgroundColor={0x0b0d12}
        onResize={handleResize}
      >
        {initRenderer}
      </PixiContainerWrapper>
      <InspectorOverlay visible={showInspectorOverlay} pointerEvents="none">
        <InspectorRenderer
          frame={inspectorFrame}
          width={viewportSize.width}
          height={viewportSize.height}
          tileSize={tileSize}
          centerX={stream.center.x}
          centerY={stream.center.y}
        />
      </InspectorOverlay>
    </div>
  );
}
