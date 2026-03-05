import React from "react";
import { Box, Text } from "ink";

interface InputPromptProps {
  input: string;
  isExecuting: boolean;
  progress: { phase?: string; value?: number; message?: string } | null;
  activeSuggestion: string | null;
}

export function InputPrompt({ input, isExecuting, progress, activeSuggestion }: InputPromptProps) {
  return (
    <Box padding={1} flexDirection="column">
      {isExecuting && progress && (
        <Box flexDirection="row">
          <Text color="magenta" bold>{`[${progress.phase || "working"}] `}</Text>
          <Text color="cyan">{progress.value !== undefined ? `${progress.value}% ` : ''}</Text>
          <Text>{progress.message || "..."}</Text>
        </Box>
      )}
      {!isExecuting && (
        <Box flexDirection="row">
          <Text color="green" bold>
            {"\u276F "}
          </Text>
          <Text>{input}</Text>
          {activeSuggestion && activeSuggestion !== input && activeSuggestion.startsWith(input) ? (
            <Text color="gray">{activeSuggestion.slice(input.length)}</Text>
          ) : null}
          <Text backgroundColor="white" color="black">{" "}</Text>
        </Box>
      )}
    </Box>
  );
}
