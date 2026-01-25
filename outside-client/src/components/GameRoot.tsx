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
      // Manual 60 FPS cap (robust on 120Hz displays).
      // We stop Pixi's automatic ticker and drive it ourselves via requestAnimationFrame,
      // only calling `ticker.update(now)` when enough time has elapsed.
      const FPS = 60;
      const fpsInterval = 1000 / FPS;

      app.ticker.maxFPS = 0; // disable Pixi's internal maxFPS gate (we gate manually)
      app.ticker.stop();

      let then = performance.now();
      let rafId = 0;

      const animate = (now: number) => {
        rafId = requestAnimationFrame(animate);

        const elapsed = now - then;
        if (elapsed > fpsInterval) {
          then = now - (elapsed % fpsInterval);
          app.ticker.update(now);
        }
      };

      rafId = requestAnimationFrame(animate);

      console.log('[GameRoot] AppInitializer: App ready, calling onAppReady');
      onAppReady(app);

      return () => {
        cancelAnimationFrame(rafId);
        // Restore default behavior if this component unmounts.
        app.ticker.start();
      };
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
      preference="webgpu"
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
