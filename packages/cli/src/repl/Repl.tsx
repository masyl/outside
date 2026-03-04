import React, { useState, useEffect, useMemo, useRef } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import { ScrollView, ScrollViewRef } from "ink-scroll-view";
import { ScrollBar } from "@byteland/ink-scroll-bar";
import { useScreenSize } from "fullscreen-ink";
import { ContextRouter } from "./Router.ts";
import { executeCommand, ExecutionEvent } from "./Executor.ts";
import { CommandHistory } from "./History.ts";
import { AndonService } from "../andon/Service.ts";
import { AndonPanel } from "../andon/components.tsx";
import { OrbMachine } from "../core/orb.ts";

export function Repl() {
  const { exit } = useApp();
  const { height } = useScreenSize();
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<any[]>(["Outside CLI v0.1.0 initialized."]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<{ phase?: string; value?: number; message?: string } | null>(null);
  const scrollRef = useRef<ScrollViewRef>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const router = useMemo(() => new ContextRouter(), []);
  const history = useMemo(() => new CommandHistory(), []);
  const andonService = useMemo(() => new AndonService(), []);

  // Initial help command trigger
  useEffect(() => {
    const execPlan = router.translate("help");
    if (!execPlan) return;
    
    setIsExecuting(true);
    executeCommand(execPlan, (event: ExecutionEvent) => {
      if (event.type === "stdout" || event.type === "stderr") {
        if (event.message) setLogs((prev: any[]) => [...prev, event.message!.trim()]);
      } else if (event.type === "done") {
        setLogs((prev: any[]) => [...prev, ``]);
        setIsExecuting(false);
      }
    });
  }, [router]);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    // A small timeout ensures measuring happens after render
    setTimeout(() => {
      scrollRef.current?.scrollToBottom();
    }, 10);
  }, [logs.length]);

  const [currentPath, setCurrentPath] = useState(router.getCurrentPath());
  
  const [andonData, setAndonData] = useState<OrbMachine[]>([]);
  const [andonState, setAndonState] = useState<string>("stopped");

  useEffect(() => {
    return andonService.subscribe((data, state) => {
      setAndonData(data);
      setAndonState(state);
    });
  }, [andonService]);

  const [suggestionIdx, setSuggestionIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    history.load();
  }, [history]);

  // Update suggestions whenever input or path changes
  useEffect(() => {
    const available = router.getAvailableCommands();
    const inputTrim = input.trim();
    if (inputTrim === "") {
      setSuggestions(available);
    } else {
      const matches = available.filter(cmd => cmd.startsWith(input));
      setSuggestions(matches);
    }
    setSuggestionIdx(-1);
  }, [input, currentPath, router]);

  const activeSuggestion = suggestionIdx >= 0 ? suggestions[suggestionIdx] : (suggestions.length === 1 ? suggestions[0] : null);

  useInput((inputChar, key) => {
    if (isExecuting) {
      if ((key.ctrl && inputChar === "c") || key.escape) {
        // We'd ideally send a kill signal to the child here via a ref.
        // For now, we just pretend it stopped so the UI unlocks
        setIsExecuting(false);
        setProgress(null);
        setLogs((prev: any[]) => [...prev, `> Command aborted by user.`]);
      }
      return; // Ignore regular input while executing
    }

    if (key.return) {
      let finalInput = input;
      if (activeSuggestion && input !== activeSuggestion) {
        // If we hit return while a suggestion is visible, normally we just accept the input we typed.
        // Wait, normally Return executes the exact string. If user relies on ghost text, we should expand it?
        // Let's execute what is actually typed, or if suggestion is cycled, execute cycled suggestion.
        finalInput = input;
      }

      const trimmed = finalInput.trim();
      if (!trimmed) return;

      history.push(trimmed);
      
      if (trimmed === "quit" || trimmed === "exit") {
        exit();
        return;
      }
      if (trimmed === "clear") {
         setLogs([]);
         setInput("");
         return;
      }

      const commandHeading = (
        <Box flexDirection="row" paddingY={1} key={`heading-${Date.now()}`}>
          <Text color="#444444">{"\u2500\u2524  "}</Text>
          <Text color="white" bold>{"❯ " + trimmed + "  "}</Text>
          <Text color="#444444">{"\u251C\u2500\u2500\u2524  "}</Text>
          <Text color="#666666">{"\u022e " + currentPath + "  "}</Text>
          <Text color="#444444">{"\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"}</Text>
        </Box>
      );
      setLogs((prev: any[]) => [...prev, commandHeading]);
      setInput("");

      const execPlan = router.translate(trimmed);
      if (!execPlan) {
        setLogs((prev: any[]) => [...prev, `Command not recognized in context ${currentPath}`]);
        return;
      }

      if (execPlan.command === "cd") {
         if (router.cd(execPlan.args[0])) {
            setCurrentPath(router.getCurrentPath());
         } else {
            setLogs((prev: any[]) => [...prev, `Cannot cd into '${execPlan.args[0]}': No such context.`]);
         }
         return;
      }

      // Force an Andon poll if making queries
      if (trimmed === "list" || trimmed === "status") {
         andonService.requestRefresh();
      }

      // Execute external command
      setIsExecuting(true);
      executeCommand(execPlan, (event: ExecutionEvent) => {
        if (event.type === "stdout" || event.type === "stderr") {
           if (event.message) setLogs((prev: any[]) => [...prev, event.message!.trim()]);
        } else if (event.type === "progress") {
           setProgress({ phase: event.phase, value: event.progress, message: event.message });
           // Optionally, also log it if you want history, but usually progress bars are ephemeral
        } else if (event.type === "error") {
           setLogs((prev: any[]) => [...prev, `Error: ${event.message}`]);
           setIsExecuting(false);
           setProgress(null);
        } else if (event.type === "done") {
           // Provide an empty line padding after command completes
           setLogs((prev: any[]) => [...prev, ``]);
           setIsExecuting(false);
           setProgress(null);
        }
      });
    } else if (key.pageUp) {
      const height = scrollRef.current?.getViewportHeight() || 1;
      scrollRef.current?.scrollBy(-height);
    } else if (key.pageDown) {
      const height = scrollRef.current?.getViewportHeight() || 1;
      scrollRef.current?.scrollBy(height);
    } else if (key.tab) {
      if (suggestions.length > 0) {
        if (suggestionIdx === -1) {
          setInput(suggestions[0]);
          setSuggestionIdx(0);
        } else {
          const nextIdx = (suggestionIdx + 1) % suggestions.length;
          setInput(suggestions[nextIdx]);
          setSuggestionIdx(nextIdx);
        }
      }
    } else if (key.upArrow) {
      const prev = history.getPreviousCommand();
      if (prev !== null) setInput(prev);
    } else if (key.downArrow) {
      const next = history.getNextCommand();
      if (next !== null && next !== "") {
        setInput(next);
      } else if (input.trim() === "") {
        // At bottom of history and neutral state: cycle available commands
        if (suggestions.length > 0) {
          const nextIdx = suggestionIdx === -1 ? 0 : (suggestionIdx + 1) % suggestions.length;
          setInput(suggestions[nextIdx]);
          setSuggestionIdx(nextIdx);
        } else {
          setInput("");
        }
      } else {
        setInput("");
      }
    } else if (key.backspace || key.delete) {
      setInput((prev: string) => prev.slice(0, -1));
    } else if (key.escape) {
      setInput("");
      setSuggestionIdx(-1);
    } else {
      if (inputChar && inputChar !== "\t" && inputChar !== "\r" && inputChar !== "\n") {
        setInput((prev: string) => prev + inputChar);
      }
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      {/* Main output area using ScrollView. 5 terminal rows reserved for borders and UI. */}
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

      {/* Input Prompt or Progress Bar */}
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

      {/* Status Bar */}
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

    </Box>
  );
}
