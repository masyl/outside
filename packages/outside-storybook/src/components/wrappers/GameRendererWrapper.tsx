import React, { useEffect, useRef } from 'react';
import { init } from '@outside/client/src/main';

interface GameWrapperProps {
  store: any;
  startupCommands?: string[];
}

export const GameWrapper: React.FC<GameWrapperProps> = ({ store, startupCommands }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the game in this container (full size)
    init({
      container: containerRef.current,
      store,
      mode: 'local',
      startupCommands,
    }).catch((error) => {
      console.error('Failed to initialize game in story:', error);
    });

    // No cleanup, as the game manages its own lifecycle
  }, [store]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};
