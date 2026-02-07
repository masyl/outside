import React, { useEffect, useMemo, useRef } from 'react';
import { TextStyle } from 'pixi.js';
import { useApplication } from '@pixi/react';
import { useDebugState, debugStore } from '../debug/debugStore';

export const DebugPanel: React.FC = () => {
  const { app } = useApplication();
  const state = useDebugState();
  const appTickerFrameCountRef = useRef(0);
  const lastAppTickerFpsUpdateRef = useRef(0);
  const rafFrameCountRef = useRef(0);
  const lastRafFpsUpdateRef = useRef(0);

  // Measure FPS using the actual app ticker (not useTick, which may be bound to a different ticker).
  useEffect(() => {
    if (!app) return;
    if (!state.visible) return;
    const onTick = () => {
      appTickerFrameCountRef.current++;
      const now = performance.now();
      if (now - lastAppTickerFpsUpdateRef.current >= 1000) {
        debugStore.update({
          fps: appTickerFrameCountRef.current, // keep existing label for backward compatibility
          tickerFps: app.ticker.FPS ?? 0,
          tickerMaxFps: app.ticker.maxFPS ?? 0,
          tickerMinFps: app.ticker.minFPS ?? 0,
        });
        appTickerFrameCountRef.current = 0;
        lastAppTickerFpsUpdateRef.current = now;
      }
    };

    app.ticker.add(onTick);
    return () => {
      app.ticker.remove(onTick);
    };
  }, [app, state.visible]);

  // Measure raw browser rAF FPS (independent of Pixi ticker)
  useEffect(() => {
    if (!state.visible) return;
    let rafId = 0;
    let mounted = true;
    const loop = (now: number) => {
      if (!mounted) return;
      rafId = requestAnimationFrame(loop);
      rafFrameCountRef.current++;

      if (now - lastRafFpsUpdateRef.current >= 1000) {
        debugStore.update({ rafFps: rafFrameCountRef.current });
        rafFrameCountRef.current = 0;
        lastRafFpsUpdateRef.current = now;
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, [state.visible]);

  if (!state.visible) return null;

  // Creating many `Text` nodes (or recreating styles) can be expensive on Safari because
  // each changing string can trigger a texture regen. Prefer a single multiline text node.
  const style = useMemo(() => {
    return new TextStyle({
      fontFamily: 'monospace', // 'Minecraft' font might need loading, falling back to monospace
      fontSize: 16,
      lineHeight: 20,
      fill: '#00ff00',
      stroke: { color: '#000000', width: 1 },
    });
  }, []);

  const debugText = useMemo(() => {
    const lines: string[] = [];
    lines.push('Debug Panel');
    lines.push('');
    lines.push(`Version: 0.1.13`);
    lines.push(`Renderer: ${state.rendererMode}`);
    lines.push(`Mode: ${state.mode}`);
    lines.push(`FPS (rAF): ${state.rafFps}`);
    lines.push(`FPS (ticker): ${state.fps}`);
    lines.push(`Ticker.FPS: ${state.tickerFps.toFixed(1)}`);
    lines.push(`Ticker max/min: ${state.tickerMaxFps} / ${state.tickerMinFps}`);
    lines.push(`Step: ${state.step}`);
    lines.push(`Objects: ${state.surfaceCount} (Surf) / ${state.groundCount} (Gnd)`);
    lines.push(`Clients: ${state.clientCount}`);
    lines.push(`Events: ${state.eventCount}`);
    lines.push(`P2P: ${state.p2pStatus}`);
    lines.push(`Playback: ${state.playbackMode}`);
    lines.push(`Timeline: ${state.timelineCursor} / ${state.timelineTotal}`);
    lines.push(`Zoom: ${state.zoomLevel} (${state.zoomScale.toFixed(1)}x)`);
    return lines.join('\n');
  }, [
    state.clientCount,
    state.eventCount,
    state.fps,
    state.mode,
    state.p2pStatus,
    state.playbackMode,
    state.rafFps,
    state.rendererMode,
    state.step,
    state.surfaceCount,
    state.groundCount,
    state.tickerFps,
    state.tickerMaxFps,
    state.tickerMinFps,
    state.timelineCursor,
    state.timelineTotal,
    state.zoomLevel,
    state.zoomScale,
  ]);

  // Background box
  // Note: We can draw a graphics rect behind the text if needed,
  // but Pixi React v8 might make z-ordering tricky if we mix graphics and text in one component.
  // For now, let's just render the text with a stroke/shadow for readability.

  return (
    <container x={0} y={0} zIndex={10000}>
      <graphics
        draw={(g: any) => {
          g.clear();
          g.rect(0, 0, 300, 420);
          g.fill({ color: 0x000000, alpha: 0.7 });
          g.stroke({ width: 2, color: 0x00ff00 });
        }}
      />
      <container x={10} y={10}>
        <pixiText text={debugText} style={style} x={0} y={0} />
      </container>
    </container>
  );
};
