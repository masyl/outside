import React, { useEffect } from 'react';
import { Application as PixiApplication, Ticker } from 'pixi.js';
import { LevelViewport } from './LevelViewport';
import { DebugPanel } from './DebugPanel';
import { KeystrokeHelp } from './KeystrokeHelp';
import { Timeline } from './Timeline';
import { Store } from '../store/store';
import { Application, useApplication } from '@pixi/react';
import { TimelineManager } from '../timeline/manager';
import { GameRenderer } from '../renderer/renderer';

interface GameRootProps {
  onAppReady: (app: PixiApplication) => void;
  onRendererReady?: (renderer: GameRenderer) => void;
  width: number;
  height: number;
  store: Store;
  timelineManager?: TimelineManager | null;
}

// Helper to get app instance securely via hook
const AppInitializer: React.FC<{ onAppReady: (app: PixiApplication) => void }> = ({
  onAppReady,
}) => {
  const { app } = useApplication();

  useEffect(() => {
    if (app) {
      // Cap FPS to 60 to avoid runaway render loops on high refresh displays.
      // (Pixi's ticker is still vsync-driven, but this clamps the maximum update rate.)
      app.ticker.maxFPS = 60;
      // @pixi/react often uses the shared ticker; cap it as well.
      Ticker.shared.maxFPS = 60;
      console.log('[GameRoot] AppInitializer: App ready, calling onAppReady');
      onAppReady(app);
    }
  }, [app, onAppReady]);

  return null;
};

export const GameRoot: React.FC<GameRootProps> = ({
  onAppReady,
  onRendererReady,
  width,
  height,
  store,
  timelineManager,
}) => {
  return (
    <Application
      width={width}
      height={height}
      backgroundColor={0x1a1a1a}
      antialias={false}
      resolution={1}
      preference="webgpu"
      autoDensity={true}
    >
      <AppInitializer onAppReady={onAppReady} />
      <LevelViewport
        store={store}
        onRendererReady={onRendererReady}
        timelineManager={timelineManager}
      />
      <DebugPanel />
      <KeystrokeHelp />
      {timelineManager && <Timeline timelineManager={timelineManager} />}
    </Application>
  );
};
