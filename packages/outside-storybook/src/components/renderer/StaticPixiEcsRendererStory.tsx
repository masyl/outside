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

export interface StaticPixiEcsRendererStoryProps {
  seed: number;
  width?: number;
  height?: number;
  tileSize?: number;
  showDebug?: boolean;
  waitForAssets?: boolean;
  showInspectorOverlay?: boolean;
  inspectorOpacity?: number;
  buildWorld: (world: SimulatorWorld, seed: number) => void;
}

const EMPTY_FRAME: InspectorFrame = {
  tiles: [],
  entities: [],
  unknownCount: 0,
};

export function StaticPixiEcsRendererStory({
  seed,
  width = 900,
  height = 700,
  tileSize = 16,
  showDebug = false,
  waitForAssets = false,
  showInspectorOverlay = false,
  inspectorOpacity = 0.45,
  buildWorld,
}: StaticPixiEcsRendererStoryProps) {
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const rendererAppRef = useRef<Application | null>(null);
  const inspectorWorldRef = useRef(createInspectorRenderWorld());
  const [inspectorFrame, setInspectorFrame] = useState<InspectorFrame>(EMPTY_FRAME);
  const [viewportSize, setViewportSize] = useState({ width, height });
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
    const renderer = rendererRef.current;
    if (!renderer || !stream.packet) return;

    const applyPacket = async () => {
      if (waitForAssets && renderer.getAssetsReady()) {
        await renderer.getAssetsReady();
      }
      renderer.applyStream({
        kind: stream.packet!.kind,
        tic: stream.packet!.tic,
        buffer: new Uint8Array(stream.packet!.buffer),
      });

      applyInspectorStream(inspectorWorldRef.current, stream.packet!);
      setInspectorFrame(buildInspectorFrame(inspectorWorldRef.current.world));
    };

    void applyPacket();
  }, [stream.packetVersion, waitForAssets]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setViewCenter(stream.center.x, stream.center.y);
  }, [stream.center.x, stream.center.y, stream.streamKey]);

  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererAppRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width, height }}>
      <PixiContainerWrapper
        instanceKey={`pixi-ecs-static-${stream.streamKey}-${tileSize}-${width}-${height}`}
        width={width}
        height={height}
        backgroundColor={0x0b0d12}
        onResize={(_app, nextWidth, nextHeight) => {
          rendererRef.current?.setViewportSize(nextWidth, nextHeight);
          setViewportSize({ width: nextWidth, height: nextHeight });
        }}
      >
        {initRenderer}
      </PixiContainerWrapper>
      <InspectorOverlay visible={showInspectorOverlay} opacity={inspectorOpacity} pointerEvents="none">
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
