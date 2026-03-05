import React from "react";
import { Box, Text } from "ink";
import { OrbMachine } from "../../core/orb.ts";
import { AndonPanel } from "../../andon/components.tsx";

interface StatusTrayProps {
  currentPath: string;
  andonData: OrbMachine[];
  andonState: string;
}

export function StatusTray({ currentPath, andonData, andonState }: StatusTrayProps) {
  return (
    <Box borderStyle="single" borderTop={true} paddingX={1} justifyContent="space-between" borderColor="#444444">
      <Text color="blue">Ȯ {currentPath}</Text>
      {(() => {
        // Extract track context if available
        const match = currentPath.match(/^\/track\/([^/]+)/);
        if (match) {
          const trackName = match[1];
          const machine = andonData.find(m => m.name === trackName);
          return <AndonPanel status={machine?.andon} isPolling={andonState === "polling"} />;
        }
        return (
          <Box flexDirection="row">
            <Text color={andonState === "polling" ? "blue" : "gray"}>
              {`Andon Service: ${andonState}`}
            </Text>
          </Box>
        );
      })()}
    </Box>
  );
}
