import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { OrbMachine } from "../../core/orb.ts";
import { AndonPanel } from "../../andon/components.tsx";

interface StatusTrayProps {
  currentPath: string;
  andonData: OrbMachine[];
  andonState: string;
  version?: string;
}

export function StatusTray({ currentPath, andonData, andonState, version = "0.1.0" }: StatusTrayProps) {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 100) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs.toString().padStart(2, '0')}:${remainingMins.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box borderStyle="single" borderTop={true} paddingX={1} justifyContent="space-between" borderColor="#444444">
      <Box flexDirection="row">
        <Text color="blue">Ȯ {currentPath}</Text>
        <Text color="gray"> | </Text>
        <Text color="cyan">◈ v{version}</Text>
        <Text color="gray"> | </Text>
        <Text color="yellow">⧖ {formatUptime(uptime)}</Text>
      </Box>
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
