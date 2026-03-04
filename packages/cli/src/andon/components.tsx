import React from "react";
import { Text, Box } from "ink";
import { AndonStatus, AndonColor, ANDON_COLORS } from "../core/orb.ts";

export interface AndonLightProps {
  label: string;
  symbol: string;
  color: AndonColor;
  isPolling?: boolean;
}

export function AndonLight({ label, symbol, color, isPolling }: AndonLightProps) {
  // If the service is actively polling, override visual state to 'blue' to show background activity
  // Alternatively, just blink or highlight it. Let's use blue if polling is generally active.
  const visualColor = isPolling ? 'blue' : color;
  const def = ANDON_COLORS[visualColor];
  
  return (
    <Box marginRight={1}>
      <Text color={def.fg} backgroundColor={def.bg} bold>
        {` ${symbol} `}
      </Text>
    </Box>
  );
}

export function AndonPanel({ status, isPolling }: { status?: AndonStatus; isPolling: boolean }) {
  if (!status) {
    return (
      <Box flexDirection="row">
        <Text color="gray">No track data</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="row">
      <AndonLight label="Track" symbol="Tr" color={status.tr} isPolling={isPolling} />
      <AndonLight label="Container" symbol="Co" color={status.co} isPolling={isPolling} />
      <AndonLight label="Branch" symbol="Br" color={status.br} isPolling={isPolling} />
      <AndonLight label="Worktree" symbol="Wt" color={status.wt} isPolling={isPolling} />
    </Box>
  );
}
