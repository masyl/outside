import React, { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { Store } from '@outside/client/src/store/store';
import { GameRenderer } from '@outside/client/src/renderer/renderer';

interface GameRendererWrapperProps {
  width: number;
  height: number;
  store: Store;
}

export const GameRendererWrapper: React.FC<GameRendererWrapperProps> = ({
  width,
  height,
  store,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      canvas: canvasRef.current,
      width,
      height,
      backgroundColor: 0x000000,
      antialias: false, // Pixel perfect
    });

    const gameRenderer = new GameRenderer(app);
    rendererRef.current = gameRenderer;

    // Load assets and set initial world
    const initializeRenderer = async () => {
      await gameRenderer.loadAssets();
      gameRenderer.setWorld(store.getState());
    };

    initializeRenderer();

    // Subscribe to store changes
    const unsubscribe = store.subscribe((newState) => {
      gameRenderer.update(newState);
    });

    return () => {
      unsubscribe();
      app.destroy(true);
    };
  }, [width, height, store]);

  return (
    <div
      style={{
        display: 'inline-block',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
