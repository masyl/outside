import React, { useEffect, useRef } from 'react';
import { init } from '@outside/client/src/main';

interface GameWrapperProps {
  width: number;
  height: number;
  store: any;
}

export const GameWrapper: React.FC<GameWrapperProps> = ({ width, height, store }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set the container size
    containerRef.current.style.width = `${width}px`;
    containerRef.current.style.height = `${height}px`;

    // Initialize the game in this container
    init({ container: containerRef.current, store }).catch((error) => {
      console.error('Failed to initialize game in story:', error);
    });

    // No cleanup, as the game manages its own lifecycle
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-block',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};
