import React, { useEffect, useRef } from 'react';
import { useApplication } from '@pixi/react';
import { GameRenderer } from '../renderer/renderer';
import { useWorldState } from '../hooks/useStore';
import { Store } from '../store/store';
import { TimelineManager } from '../timeline/manager';

interface LevelViewportProps {
  store: Store;
  onRendererReady?: (renderer: GameRenderer) => void;
  timelineManager?: TimelineManager | null;
}

export const LevelViewport: React.FC<LevelViewportProps> = ({
  store,
  onRendererReady,
  timelineManager,
}) => {
  const { app } = useApplication();
  const rendererRef = useRef<GameRenderer | null>(null);
  const world = useWorldState(store);

  // Initialize renderer once
  useEffect(() => {
    if (!app || rendererRef.current) return;

    console.log('[LevelViewport] Initializing GameRenderer');

    // Create renderer
    // Note: GameRenderer constructor currently adds itself to app.stage
    // We might want to change this later to be more contained
    const renderer = new GameRenderer(app);
    rendererRef.current = renderer;

    // Load assets
    renderer.loadAssets().then(() => {
      // Notify parent if needed
      if (onRendererReady) {
        onRendererReady(renderer);
      }

      // Initial update
      renderer.setWorld(store.getState());
    });
  }, [app, store, onRendererReady]);

  // Update renderer when world state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.update(world);
    }
  }, [world]);

  // Add Timeline to GameRenderer when available
  useEffect(() => {
    if (timelineManager && rendererRef.current) {
      console.log('[LevelViewport] Adding Timeline to GameRenderer');
      // For now, just log that Timeline was added
      // TODO: Implement Timeline component integration with GameRenderer
    }
  }, [timelineManager]);

  return null; // This component doesn't render React nodes, it manages the imperative renderer
};
