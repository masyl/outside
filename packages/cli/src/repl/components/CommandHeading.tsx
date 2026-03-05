import React from "react";
import { Box, Text } from "ink";

interface CommandHeadingProps {
  commandStr: string;
  currentPath: string;
}

export function CommandHeading({ commandStr, currentPath }: CommandHeadingProps) {
  return (
    <Box flexDirection="row" paddingY={1} key={`heading-${Date.now()}-${Math.random()}`}>
      <Box flexDirection="row">
        <Box paddingRight={1}><Text color="#444444">{"\u2500\u2524"}</Text></Box>
        <Text color="white" bold>{"❯ " + commandStr + "  "}</Text>
        <Text color="#444444">{"\u251C\u2500\u2500\u2524  "}</Text>
        <Text color="#666666">{"\u022e " + currentPath + "  "}</Text>
        <Text color="#444444">{"\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"}</Text>
      </Box>
    </Box>
  );
}
