import React, { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import type { CSSProperties } from 'react';

interface PixiContainerWrapperProps {
  children: (app: Application) => void;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  backgroundColor?: number;
  instanceKey?: string;
  onResize?: (app: Application, width: number, height: number) => void;
}

let NEXT_STORYBOOK_PIXI_APP_ID = 1;

export const PixiContainerWrapper: React.FC<PixiContainerWrapperProps> = ({
  children,
  width = '100%',
  height = '100%',
  backgroundColor = 0x000000,
  instanceKey = 'default',
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const readyRef = useRef(false);
  const childrenRef = useRef(children);
  const [readyVersion, setReadyVersion] = useState(0);

  useEffect(() => {
    childrenRef.current = children;
    if (appRef.current && readyRef.current) {
      children(appRef.current);
    }
  }, [children]);

  useEffect(() => {
    let cancelled = false;
    let initialized = false;
    let destroyed = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (appRef.current) return undefined;

    const app = new Application();
    const appId = NEXT_STORYBOOK_PIXI_APP_ID++;
    appRef.current = app;
    (window as any).__pixiApp = app;

    const destroyApp = () => {
      if (destroyed) return;
      destroyed = true;
      try {
        app.destroy(
          { removeView: false },
          {
            children: true,
            texture: true,
            textureSource: true,
          }
        );
      } catch (error) {
        console.warn('[PixiContainerWrapper] destroy failed', error);
      }
    };

    (async () => {
      try {
        const rect = canvas.getBoundingClientRect();
        const initialWidth = Math.max(1, Math.floor(rect.width));
        const initialHeight = Math.max(1, Math.floor(rect.height));
        await app.init({
          canvas,
          width: initialWidth,
          height: initialHeight,
          backgroundColor,
          antialias: false,
          resolution: 1,
          roundPixels: true,
        });
        initialized = true;

        if (cancelled) {
          destroyApp();
          return;
        }

        app.renderer.clearBeforeRender = true;
        app.stage.label = `storybook:pixi-app#${appId}:stage`;
        readyRef.current = true;
        setReadyVersion((v) => v + 1);
        childrenRef.current(app);

        void initDevtools({ app }).catch((error) => {
          console.warn('[PixiContainerWrapper] pixi devtools init failed', error);
        });
      } catch (error) {
        console.warn('[PixiContainerWrapper] init failed', error);
        destroyApp();
      }
    })();

    return () => {
      cancelled = true;
      if (initialized) {
        destroyApp();
      }
      readyRef.current = false;
      if (appRef.current === app) {
        appRef.current = null;
      }
      if ((window as any).__pixiApp === app) {
        (window as any).__pixiApp = null;
      }
    };
  }, [instanceKey, backgroundColor]);

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
  }, [width, height, backgroundColor, onResize, instanceKey, readyVersion]);

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
