import React, { useCallback } from 'react';
import type { Application } from 'pixi.js';
import { PixiContainerWrapper } from '../wrappers/PixiContainerWrapper';

export interface PixiCanvasStoryProps {
  width?: number;
  height?: number;
  backgroundColor?: number;
  draw: (app: Application) => void;
}

export function PixiCanvasStory({
  width = 900,
  height = 700,
  backgroundColor = 0x0b0d12,
  draw,
}: PixiCanvasStoryProps) {
  const init = useCallback(
    (app: Application) => {
      app.stage.removeChildren();
      draw(app);
    },
    [draw]
  );

  return (
    <PixiContainerWrapper width={width} height={height} backgroundColor={backgroundColor}>
      {init}
    </PixiContainerWrapper>
  );
}
