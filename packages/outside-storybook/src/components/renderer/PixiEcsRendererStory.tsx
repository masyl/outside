import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Application } from 'pixi.js';
import { PixiEcsRenderer } from '@outside/renderer';
import {
  InspectorOverlay,
  InspectorRenderer,
  applyInspectorStream,
  buildInspectorFrame,
  createInspectorRenderWorld,
  type InspectorFrame,
} from '@outside/inspector-renderer';
import type { SpawnFn } from '../simulator/useSimulatorWorld';
import { PixiContainerWrapper } from '../wrappers/PixiContainerWrapper';
import { useScenarioRenderStream } from './useScenarioRenderStream';

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
  showInspectorOverlay?: boolean;
  inspectorOpacity?: number;
}

const EMPTY_FRAME: InspectorFrame = {
  tiles: [],
  entities: [],
  unknownCount: 0,
};

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
  showInspectorOverlay = false,
  inspectorOpacity = 0.45,
}: PixiEcsRendererStoryProps) {
  const rendererRef = useRef<PixiEcsRenderer | null>(null);
  const rendererAppRef = useRef<Application | null>(null);
  const inspectorWorldRef = useRef(createInspectorRenderWorld());
  const [inspectorFrame, setInspectorFrame] = useState<InspectorFrame>(EMPTY_FRAME);
  const [viewportSize, setViewportSize] = useState({ width, height });
  const [rendererReady, setRendererReady] = useState(0);

  const stream = useScenarioRenderStream({
    mode: 'dynamic',
    seed,
    entityCount,
    ticsPerSecond,
    spawnFn,
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
    renderer.resetWorld();
    renderer.setTileSize(tileSize);
    renderer.setDebugEnabled(showDebug);
  }, [rendererReady, tileSize, showDebug, stream.streamKey]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const packet = stream.packet;
    if (!renderer || !packet) return;

    const applyPacket = async () => {
      if (waitForAssets && renderer.getAssetsReady()) {
        await renderer.getAssetsReady();
      }
      renderer.applyStream({
        kind: packet.kind,
        tic: packet.tic,
        buffer: new Uint8Array(packet.buffer),
      });

      applyInspectorStream(inspectorWorldRef.current, packet);
      setInspectorFrame(buildInspectorFrame(inspectorWorldRef.current.world));
    };

    void applyPacket();
  }, [rendererReady, stream.packetVersion, waitForAssets]);

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
        instanceKey={`pixi-ecs-${stream.streamKey}-${tileSize}-${width}-${height}`}
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
