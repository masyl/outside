import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Graphics } from 'pixi.js';
import { useApplication } from '@pixi/react';
import { TimelineManager } from '../timeline/manager';
import { PlaybackState } from '../timeline/types';

interface TimelineProps {
  timelineManager: TimelineManager;
}

// Configuration
const CONFIG = {
  barHeight: 12,
  padding: 12,
  innerPadding: 6,
  sideOffset: 12,
  bottomOffset: 50,
  markerWidth: 4,
  markerHeight: 24,
  cornerRadius: 8,
  tickWidth: 1,
  colors: {
    background: 0x000000,
    bar: 0x00ff00,
    marker: 0xffffff,
    markerBorder: 0x000000,
    tick: 0x000000,
    borderHover: 0x40ff40,
  },
};

export const Timeline: React.FC<TimelineProps> = ({ timelineManager }) => {
  const { app } = useApplication();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Subscribe to TimelineManager updates
  useEffect(() => {
    // Initial state
    const updateState = () => {
      const state = timelineManager.getState();
      const playbackState = timelineManager.getPlaybackState();

      setCurrentStep(state.currentStep);
      setTotalSteps(state.totalSteps);
      setIsVisible(
        playbackState === PlaybackState.TRAVELING || playbackState === PlaybackState.PAUSED
      );
    };

    updateState();

    timelineManager.onStateChange(() => updateState());
    timelineManager.onPositionChange(() => updateState());
  }, [timelineManager]);

  // Handle interaction
  const calculateTargetStep = useCallback(
    (globalX: number) => {
      if (!app) return 0;

      const screenWidth = app.screen.width;
      const barWidth = screenWidth - CONFIG.sideOffset * 2;
      const relativeX = globalX - CONFIG.sideOffset; // Component X is sideOffset

      const fraction = Math.max(0, Math.min(1, relativeX / barWidth));
      const targetStep = Math.floor(fraction * (totalSteps - 1));
      return targetStep;
    },
    [app, totalSteps]
  );

  const onPointerDown = useCallback(
    (e: any) => {
      setIsDragging(true);
      const step = calculateTargetStep(e.global.x);
      timelineManager.goToStep(step);
    },
    [calculateTargetStep, timelineManager]
  );

  const onPointerMove = useCallback(
    (e: any) => {
      if (isDragging) {
        const step = calculateTargetStep(e.global.x);
        timelineManager.goToStep(step);
      }
    },
    [isDragging, calculateTargetStep, timelineManager]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global pointer up to catch releases outside component
  useEffect(() => {
    if (isDragging) {
      const handleGlobalUp = () => setIsDragging(false);
      window.addEventListener('pointerup', handleGlobalUp);
      return () => window.removeEventListener('pointerup', handleGlobalUp);
    }
  }, [isDragging]);

  // Calculate layout (always call hooks before early return)
  const screenWidth = app?.screen?.width ?? 0;
  const screenHeight = app?.screen?.height ?? 0;
  const barWidth = screenWidth - CONFIG.sideOffset * 2;
  const totalHeight = CONFIG.barHeight + CONFIG.padding * 2;
  const x = CONFIG.sideOffset;
  const y = screenHeight - CONFIG.bottomOffset - totalHeight;

  // Draw function callback (defined before early return)
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();

      // Background
      g.roundRect(0, 0, barWidth, totalHeight, CONFIG.cornerRadius);
      g.fill({ color: CONFIG.colors.background, alpha: 1.0 });
      g.stroke({ width: 2, color: isHovered ? CONFIG.colors.borderHover : CONFIG.colors.bar });

      // Bar (Green)
      const innerBarWidth = barWidth; // Full width inside padding
      g.roundRect(0, CONFIG.padding, innerBarWidth, CONFIG.barHeight, CONFIG.cornerRadius);
      g.fill({ color: CONFIG.colors.bar });

      // Inner Padding (Black masks)
      if (CONFIG.innerPadding > 0) {
        g.rect(0, CONFIG.padding, CONFIG.innerPadding, CONFIG.barHeight);
        g.rect(
          barWidth - CONFIG.innerPadding,
          CONFIG.padding,
          CONFIG.innerPadding,
          CONFIG.barHeight
        );
        g.fill({ color: CONFIG.colors.background });
      }

      // Ticks
      if (totalSteps > 0) {
        const usableWidth = barWidth - CONFIG.innerPadding * 2;
        g.fillStyle.color = CONFIG.colors.tick; // Set fill style for rects

        // Optimization: Don't draw every tick if too many steps
        const stepStride = Math.max(1, Math.floor(totalSteps / 100)); // Max ~100 ticks

        for (let i = 0; i < totalSteps; i += stepStride) {
          if (i === 0 || i === totalSteps - 1) continue;

          const normalized = i / (totalSteps - 1);
          const tickX = normalized * usableWidth + CONFIG.innerPadding;

          g.rect(
            tickX - CONFIG.tickWidth / 2,
            CONFIG.padding + CONFIG.barHeight * 0.66,
            CONFIG.tickWidth,
            CONFIG.barHeight * 0.33
          );
          g.fill();
        }
      }

      // Marker
      if (totalSteps > 0) {
        const usableWidth = barWidth - CONFIG.innerPadding * 2;
        const markerX = (currentStep / (totalSteps - 1)) * usableWidth + CONFIG.innerPadding;
        const markerY = CONFIG.padding - (CONFIG.markerHeight - CONFIG.barHeight) / 2;

        g.rect(markerX - CONFIG.markerWidth / 2, markerY, CONFIG.markerWidth, CONFIG.markerHeight);
        g.fill({ color: CONFIG.colors.marker });
        g.stroke({ width: 1, color: CONFIG.colors.markerBorder });
      }
    },
    [barWidth, totalHeight, isHovered, totalSteps, currentStep]
  );

  // Early return AFTER all hooks are called
  if (!isVisible || !app) {
    return null;
  }

  return (
    <container
      x={x}
      y={y}
      zIndex={99999}
      eventMode="static"
      cursor="pointer"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointerover={() => setIsHovered(true)}
      onpointerout={() => setIsHovered(false)}
    >
      <graphics draw={draw} />
    </container>
  );
};
