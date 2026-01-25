import React, { useEffect } from 'react';
import { Application as PixiApplication } from 'pixi.js';
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
      // Prefer Pixi's normal ticker loop; if we want a hard 60fps cap later,
      // we should use a robust strategy (59.99 workaround) rather than stopping the ticker.
      app.ticker.maxFPS = 59.99;
      app.ticker.start();
      onAppReady(app);
    }
    return;
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
      // WebGPU can be jittery on some machines/browsers; prefer WebGL for stable frame pacing.
      preference="webgl"
      autoDensity={true}
      sharedTicker={false}
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
