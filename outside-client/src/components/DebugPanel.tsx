import React, { useEffect, useRef } from 'react';
import { TextStyle } from 'pixi.js';
import { useApplication, useTick } from '@pixi/react';
import { useDebugState, debugStore } from '../debug/debugStore';

export const DebugPanel: React.FC = () => {
  const { app } = useApplication();
  const state = useDebugState();
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);

  // Measure FPS using Pixi ticker hook
  useTick((ticker) => {
    frameCountRef.current++;
    const now = performance.now();

    if (now - lastFpsUpdateRef.current >= 1000) {
      debugStore.update({ fps: frameCountRef.current });
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
  });

  if (!state.visible) return null;

  const style = new TextStyle({
    fontFamily: 'monospace', // 'Minecraft' font might need loading, falling back to monospace
    fontSize: 16,
    fill: '#00ff00',
    stroke: { color: '#000000', width: 1 },
  });

  const lineHeight = 20;
  const padding = 0;

  // Background box
  // Note: We can draw a graphics rect behind the text if needed,
  // but Pixi React v8 might make z-ordering tricky if we mix graphics and text in one component.
  // For now, let's just render the text with a stroke/shadow for readability.

  return (
    <container x={padding} y={padding} zIndex={10000}>
      <graphics
        draw={(g: any) => {
          g.clear();
          g.rect(0, 0, 300, 420);
          g.fill({ color: 0x000000, alpha: 0.7 });
          g.stroke({ width: 2, color: 0x00ff00 });
        }}
      />
      <container x={10} y={10}>
        <pixiText text={`Debug Panel`} style={style} y={0} />
        <graphics
          draw={(g: any) => {
            g.moveTo(0, 22);
            g.lineTo(230, 22);
            g.stroke({ width: 1, color: 0x00ff00 });
          }}
        />

        <pixiText text={`Version: 0.1.13`} style={style} y={lineHeight + 10} />
        <pixiText text={`Renderer: ${state.rendererMode}`} style={style} y={lineHeight * 2 + 10} />
        <pixiText text={`Mode: ${state.mode}`} style={style} y={lineHeight * 3 + 10} />
        <pixiText text={`FPS: ${state.fps}`} style={style} y={lineHeight * 4 + 10} />
        <pixiText text={`Step: ${state.step}`} style={style} y={lineHeight * 5 + 10} />
        <pixiText
          text={`Objects: ${state.surfaceCount} (Surf) / ${state.groundCount} (Gnd)`}
          style={style}
          y={lineHeight * 6 + 10}
        />
        <pixiText text={`Clients: ${state.clientCount}`} style={style} y={lineHeight * 7 + 10} />
        <pixiText text={`Events: ${state.eventCount}`} style={style} y={lineHeight * 8 + 10} />
        <pixiText text={`P2P: ${state.p2pStatus}`} style={style} y={lineHeight * 9 + 10} />
        <pixiText text={`Playback: ${state.playbackMode}`} style={style} y={lineHeight * 10 + 10} />
        <pixiText
          text={`Timeline: ${state.timelineCursor} / ${state.timelineTotal}`}
          style={style}
          y={lineHeight * 11 + 10}
        />
        <pixiText
          text={`Zoom: ${state.zoomLevel} (${state.zoomScale.toFixed(1)}x)`}
          style={style}
          y={lineHeight * 12 + 10}
        />
      </container>
    </container>
  );
};
