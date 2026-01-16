import React, { ReactNode, useEffect, useState } from 'react';
import { Store } from '@outside/client/src/store/store';
import { executeCommand } from '@outside/client/src/commands/handlers';
import { parseCommand } from '@outside/client/src/commands/parser';

interface StoreWrapperProps {
  children: (store: Store) => ReactNode;
  initialCommands?: string[];
}

export const StoreWrapper: React.FC<StoreWrapperProps> = ({ children, initialCommands = [] }) => {
  const [store] = useState(() => new Store());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Execute initial commands to set up the world
    for (const commandString of initialCommands) {
      const parsedCommand = parseCommand(commandString);
      if (parsedCommand.type !== 'unknown') {
        executeCommand(store, parsedCommand);
      }
    }
    setIsInitialized(true);
  }, [store, initialCommands]);

  if (!isInitialized) {
    return <div>Initializing story...</div>;
  }

  return <>{children(store)}</>;
};
