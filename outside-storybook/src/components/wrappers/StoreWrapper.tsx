import React, { ReactNode, useEffect, useState } from 'react';
import { Store } from '@outside/client/src/store/store';
import { createWorldState } from '@outside/core';
import { executeCommand } from '@outside/client/src/commands/handlers';

interface StoreWrapperProps {
  children: (store: Store) => ReactNode;
  initialCommands?: string[];
}

export const StoreWrapper: React.FC<StoreWrapperProps> = ({ children, initialCommands = [] }) => {
  const [store] = useState(() => new Store());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeStore = async () => {
      // Execute initial commands to set up the world
      for (const commandString of initialCommands) {
        try {
          const response = await fetch('/api/parse-command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: commandString }),
          });

          if (response.ok) {
            const parsedCommand = await response.json();
            if (parsedCommand.type !== 'unknown') {
              executeCommand(store, parsedCommand);
            }
          }
        } catch (error) {
          // Fallback: execute command directly without server
          // This would require importing parseCommand directly
          console.warn('Failed to parse command via API:', commandString);
        }
      }
      setIsInitialized(true);
    };

    initializeStore();
  }, [store, initialCommands]);

  if (!isInitialized) {
    return <div>Initializing story...</div>;
  }

  return <>{children(store)}</>;
};
