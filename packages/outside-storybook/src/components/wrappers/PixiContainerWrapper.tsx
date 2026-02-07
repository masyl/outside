import React, { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

interface PixiContainerWrapperProps {
  children: (app: Application) => void;
  width?: number;
  height?: number;
  backgroundColor?: number;
}

export const PixiContainerWrapper: React.FC<PixiContainerWrapperProps> = ({
  children,
  width = 800,
  height = 600,
  backgroundColor = 0x000000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      canvas: canvasRef.current,
      width,
      height,
      backgroundColor,
      antialias: true,
    });

    appRef.current = app;
    children(app);

    return () => {
      app.destroy(true);
    };
  }, [children, width, height, backgroundColor]);

  return <canvas ref={canvasRef} />;
};
