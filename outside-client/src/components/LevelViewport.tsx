import React, { useEffect, useRef } from 'react';
import { useApplication } from '@pixi/react';
import { GameRenderer } from '../renderer/renderer';
import { useWorldState } from '../hooks/useStore';
import { Store } from '../store/store';

interface LevelViewportProps {
  store: Store;
  onRendererReady?: (renderer: GameRenderer) => void;
}

export const LevelViewport: React.FC<LevelViewportProps> = ({ store, onRendererReady }) => {
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

    // We don't need to cleanup the renderer specifically as it just manages containers on the stage
    // But ideally we should destroy the containers when unmounting
    return () => {
      // TODO: Add destroy method to GameRenderer
    };
  }, [app, store, onRendererReady]);

  // Update renderer when world state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.update(world);
    }
  }, [world]);

  // Handle Resize
  useEffect(() => {
    if (!app) return;

    const handleResize = () => {
      rendererRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [app]);

  return null; // This component doesn't render React nodes, it manages the imperative renderer
};
