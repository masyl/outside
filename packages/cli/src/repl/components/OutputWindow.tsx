import React from "react";
import { Box, Text } from "ink";
import { ScrollView, ScrollViewRef } from "ink-scroll-view";
import { ScrollBar } from "@byteland/ink-scroll-bar";

interface OutputWindowProps {
  logs: any[];
  height: number;
  scrollRef: React.RefObject<ScrollViewRef>;
  scrollOffset: number;
  contentHeight: number;
  viewportHeight: number;
  setScrollOffset: (offset: number) => void;
  setContentHeight: (height: number) => void;
  setViewportHeight: (height: number) => void;
}

export function OutputWindow({
  logs,
  height,
  scrollRef,
  scrollOffset,
  contentHeight,
  viewportHeight,
  setScrollOffset,
  setContentHeight,
  setViewportHeight,
}: OutputWindowProps) {
  return (
    <Box flexGrow={1} flexDirection="row" borderStyle="single" paddingLeft={3} paddingRight={1} overflowY="hidden">
      <Box flexGrow={1} flexDirection="column" overflowY="hidden">
        <ScrollView
          ref={scrollRef}
          height={Math.max(1, height - 5)}
          onScroll={setScrollOffset}
          onContentHeightChange={setContentHeight}
          onViewportSizeChange={(layout: any) => setViewportHeight(layout.height)}
        >
          {/* Spacer block pushes sparse logs strictly to the bottom */}
          <Box height={Math.max(0, height - 5 - logs.length)} flexDirection="column" />
          {logs.map((log: any, index: number) => (
            <React.Fragment key={`log-${index}`}>
              {typeof log === "string" ? <Text>{log || " "}</Text> : log}
            </React.Fragment>
          ))}
        </ScrollView>
      </Box>
      <Box marginLeft={1}>
        <ScrollBar
          placement="inset"
          style="dots"
          contentHeight={contentHeight}
          viewportHeight={viewportHeight}
          scrollOffset={scrollOffset}
          autoHide={true}
        />
      </Box>
    </Box>
  );
}
