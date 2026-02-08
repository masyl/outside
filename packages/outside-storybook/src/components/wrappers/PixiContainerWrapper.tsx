import React, { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

interface PixiContainerWrapperProps {
  children: (app: Application) => void;
  width?: number;
  height?: number;
  backgroundColor?: number;
  onResize?: (app: Application, width: number, height: number) => void;
}

export const PixiContainerWrapper: React.FC<PixiContainerWrapperProps> = ({
  children,
  width = 800,
  height = 600,
  backgroundColor = 0x000000,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const readyRef = useRef(false);
  const childrenRef = useRef(children);

  useEffect(() => {
    childrenRef.current = children;
    if (appRef.current && readyRef.current) {
      children(appRef.current);
    }
  }, [children]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (appRef.current) return undefined;

    const app = new Application();
    appRef.current = app;
    (window as any).__pixiApp = app;

    (async () => {
      await app.init({
        canvas,
        width,
        height,
        backgroundColor,
        antialias: false,
        resolution: 1,
        roundPixels: true,
      });
      app.renderer.clearBeforeRender = true;
      if (cancelled) return;
      readyRef.current = true;
      childrenRef.current(app);
    })();

    return () => {
      cancelled = true;
      try {
        app.destroy?.(true);
      } catch (error) {
        console.warn('[PixiContainerWrapper] destroy failed', error);
      }
      readyRef.current = false;
      if (appRef.current === app) {
        appRef.current = null;
      }
      if ((window as any).__pixiApp === app) {
        (window as any).__pixiApp = null;
      }
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    const container = containerRef.current;
    if (!app || !readyRef.current || !app.renderer || !container) return;

    const resizeToContainer = () => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      try {
        app.renderer.resize(nextWidth, nextHeight);
        if ((app.renderer as any).background) {
          (app.renderer as any).background.color = backgroundColor;
        }
        onResize?.(app, nextWidth, nextHeight);
      } catch (error) {
        console.warn('[PixiContainerWrapper] resize failed', error);
      }
    };

    resizeToContainer();

    const observer = new ResizeObserver(() => {
      resizeToContainer();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height, backgroundColor]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
