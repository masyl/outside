import React, { useState, useEffect, useMemo, useRef } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { ScrollViewRef } from "ink-scroll-view";
import { useScreenSize } from "fullscreen-ink";
import { join } from "jsr:@std/path@1";
import { ensureDir } from "jsr:@std/fs@1";
import { ContextRouter } from "./Router.ts";
import { executeCommand, ExecutionEvent } from "./Executor.ts";
import { CommandHistory } from "./History.ts";
import { AndonService } from "../andon/Service.ts";
import { OrbMachine } from "../core/orb.ts";
import { OutputWindow } from "./components/OutputWindow.tsx";
import { InputPrompt } from "./components/InputPrompt.tsx";
import { StatusTray } from "./components/StatusTray.tsx";
import { CommandHeading } from "./components/CommandHeading.tsx";

const CLI_DIR = join(Deno.cwd(), ".outside_cli");
const STATE_FILE = join(CLI_DIR, "state.json");
const OUTPUT_FILE = join(CLI_DIR, "output.txt");

interface ReplProps {
  version?: string;
}

export function Repl({ version = "0.1.0" }: ReplProps) {
  const { exit } = useApp();
  const { height } = useScreenSize();
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<any[]>([`Outside CLI v${version} initialized.`]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<{ phase?: string; value?: number; message?: string } | null>(null);
  const scrollRef = useRef<ScrollViewRef>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const router = useMemo(() => new ContextRouter(), []);
  const history = useMemo(() => new CommandHistory(), []);
  const andonService = useMemo(() => new AndonService(), []);

  const [currentPath, setCurrentPath] = useState(router.getCurrentPath());
  const [hasLoaded, setHasLoaded] = useState(false);

  // Persistence: Load state and logs
  useEffect(() => {
    async function initPersistence() {
      try {
        await ensureDir(CLI_DIR);
        
        // Load state (path, input)
        try {
          const stateData = await Deno.readTextFile(STATE_FILE);
          const state = JSON.parse(stateData);
          if (state.path) {
            router.cd(state.path);
            setCurrentPath(router.getCurrentPath());
          }
          if (state.input) setInput(state.input);
        } catch (_) { /* no state yet */ }

        // Load logs
        try {
          const logData = await Deno.readTextFile(OUTPUT_FILE);
          const savedLines = logData.split("\n").filter((line: string) => line.length > 0);
          if (savedLines.length > 0) {
            setLogs(savedLines);
          }
        } catch (_) { /* no logs yet */ }
      } catch (err) {
        console.error("Persistence init failed:", err);
      } finally {
        setHasLoaded(true);
      }
    }
    initPersistence();
  }, [router]);

  // Persistence: Save state
  useEffect(() => {
    if (!hasLoaded) return;
    
    async function saveState() {
      try {
        await ensureDir(CLI_DIR);
        await Deno.writeTextFile(STATE_FILE, JSON.stringify({
          path: currentPath,
          input: input
        }, null, 2));
      } catch (_) { /* ignore */ }
    }
    saveState();
  }, [currentPath, input, hasLoaded]);

  // Persistence: Save logs
  useEffect(() => {
    if (!hasLoaded) return;

    async function saveLogs() {
      try {
        await ensureDir(CLI_DIR);
        
        let processedLogs = logs;
        const MAX_SIZE = 128 * 1024; // 128KB

        const getSerializedLogs = (list: any[]) => 
          list.map((log: any) => {
            if (typeof log === "string") return log;
            if (React.isValidElement(log)) {
              return `[HEADING] ${(log.props as any)?.commandStr || "unknown"}`;
            }
            return "";
          }).join("\n");

        let textLogs = getSerializedLogs(processedLogs);

        // Cap to 128KB if needed
        if (new TextEncoder().encode(textLogs).length > MAX_SIZE) {
          const newLogs = [...logs];
          while (newLogs.length > 0 && new TextEncoder().encode(getSerializedLogs(newLogs)).length > MAX_SIZE) {
            newLogs.shift();
          }
          // We update textLogs for the write, 
          // but we don't call setLogs(...) here to avoid an immediate re-trigger.
          // The next time logs changes naturally (new command), the state will catch up.
          // Or better: only update state if it actually changed
          if (newLogs.length !== logs.length) {
             processedLogs = newLogs;
             textLogs = getSerializedLogs(processedLogs);
             setLogs(processedLogs);
             return; // Stop this cycle, setLogs will trigger a new one which we'll save
          }
        }

        await Deno.writeTextFile(OUTPUT_FILE, textLogs);
      } catch (_) { /* ignore */ }
    }
    saveLogs();
  }, [logs, hasLoaded]);

  // Initial help command trigger (only if logs are empty/default and initialized)
  useEffect(() => {
    if (!hasLoaded) return;
    if (logs.length > 1) return; // Skip if we loaded previous logs

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

  
  const [andonData, setAndonData] = useState<OrbMachine[]>([]);
  const [andonState, setAndonState] = useState<string>("stopped");

  useEffect(() => {
    return andonService.subscribe((data: OrbMachine[], state: string) => {
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
    let canceled = false;
    async function fetchSuggestions() {
      const available = await router.getAutocomplete(input);
      if (canceled) return;
      
      const inputTrim = input.trim();
      if (inputTrim === "") {
        setSuggestions(available);
      } else {
        const matches = available.filter((cmd: string) => cmd.startsWith(input));
        setSuggestions(matches);
      }
      setSuggestionIdx(-1);
    }
    fetchSuggestions();
    return () => { canceled = true; };
  }, [input, currentPath, router]);

  const activeSuggestion = suggestionIdx >= 0 ? suggestions[suggestionIdx] : (input.trim() !== "" && suggestions.length === 1 ? suggestions[0] : null);

  useInput((inputChar, key) => {
    if (isExecuting) {
      if ((key.ctrl && inputChar === "c") || key.escape) {
        setIsExecuting(false);
        setProgress(null);
        setLogs((prev: any[]) => [...prev, `> Command aborted by user.`]);
      }
      return; 
    }

    if (key.return) {
      let finalInput = input;
      const trimmed = finalInput.trim();
      if (!trimmed) return;

      history.push(trimmed);

      const handleCommandEvent = (event: ExecutionEvent) => {
        if (event.type === "stdout" || event.type === "stderr") {
           if (event.message) setLogs((prev: any[]) => [...prev, event.message!.trim()]);
        } else if (event.type === "progress") {
           setProgress({ phase: event.phase, value: event.progress, message: event.message });
        } else if (event.type === "error") {
           setLogs((prev: any[]) => [...prev, `Error: ${event.message}`]);
           setIsExecuting(false);
           setProgress(null);
        } else if (event.type === "done") {
           setLogs((prev: any[]) => [...prev, ``]);
           setIsExecuting(false);
           setProgress(null);
        }
      };

      setLogs((prev: any[]) => [...prev, <CommandHeading commandStr={trimmed} currentPath={currentPath} />]);
      setInput("");

      const execPlan = router.translate(trimmed);
      if (!execPlan) {
        setLogs((prev: any[]) => [...prev, `Command not recognized in context ${currentPath}`]);
        return;
      }

      if (execPlan.isInternal) {
         if (execPlan.command === "cd") {
            const targetDir = execPlan.args[0] || "/";
            if (router.cd(targetDir)) {
               const newPath = router.getCurrentPath();
               setCurrentPath(newPath);

               const autoCmdStr = router.getAutorun();
               if (autoCmdStr) {
                  const autoExec = router.translate(autoCmdStr);
                  if (autoExec) {
                     setLogs((prev: any[]) => [...prev, <CommandHeading commandStr={autoCmdStr} currentPath={newPath} />]);
                     setIsExecuting(true);
                     executeCommand(autoExec, handleCommandEvent);
                  }
               }
            } else {
               setLogs((prev: any[]) => [...prev, `Cannot cd into '${execPlan.args[0]}': No such context.`]);
            }
         } else if (execPlan.command === "help") {
            const cmds = router.getAvailableCommands();
            setLogs((prev: any[]) => [
               ...prev,
               `Context Help: ${currentPath}`,
               `Available Commands: ${cmds.join(" \u2022 ")}`,
               `Navigation: Use 'cd <path>' to move, 'cd ..' to go up, or type a known sub-context name.`
            ]);
         } else if (execPlan.command === "clear") {
            setLogs([]);
         } else if (execPlan.command === "quit" || execPlan.command === "exit") {
            exit();
          } else if (execPlan.command === "reboot") {
            setLogs((prev: any[]) => [...prev, `REBOOTING CONSOLE...`]);
            
            // Unmount ink gracefully before spawning new instance
            exit();
            
            setTimeout(async () => {
              const exec = Deno.execPath();
              const isDeno = exec.endsWith("deno") || exec.endsWith("deno.exe");
              let args = Deno.args;
              
              if (isDeno) {
                const path = new URL(Deno.mainModule).pathname;
                args = ["run", "-A", "--unstable", path, ...Deno.args];
              }

              const cmd = new Deno.Command(exec, {
                args: args,
                stdin: "inherit",
                stdout: "inherit",
                stderr: "inherit",
              });
              
              const child = cmd.spawn();
              await child.status;
              
              Deno.exit(0);
            }, 100);
         } else if (execPlan.command === "andon") {
            // First, try to find a contextual andon
            const match = currentPath.match(/^\/track\/([^/]+)/);
            if (match) {
              const trackName = match[1];
              // Execute track status <name>
              setIsExecuting(true);
              executeCommand({ isInternal: false, command: "track", args: ["status", trackName], options: {} }, handleCommandEvent);
              return;
            }
            
            // If in tracks context or root, or anywhere else, use 'track list'
            const fallbackPlan: CommandExecution = { isInternal: false, command: "track", args: ["list"], options: {} };

            if (currentPath === "/dev/tracks" || currentPath === "/") {
               setIsExecuting(true);
               executeCommand(fallbackPlan, handleCommandEvent);
            } else {
               setLogs((prev: any[]) => [
                  ...prev, 
                  `No contextual andons available. Here is the default andon instead:`,
                  ``
               ]);
               setIsExecuting(true);
               executeCommand(fallbackPlan, handleCommandEvent);
            }
         }
         return;
      }

      if (trimmed === "list" || trimmed === "ls") {
         andonService.requestRefresh();
      }

      setIsExecuting(true);
      executeCommand(execPlan, handleCommandEvent);
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
      <OutputWindow
        logs={logs}
        height={height}
        scrollRef={scrollRef}
        scrollOffset={scrollOffset}
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
        setScrollOffset={setScrollOffset}
        setContentHeight={setContentHeight}
        setViewportHeight={setViewportHeight}
      />

      <InputPrompt
        input={input}
        isExecuting={isExecuting}
        progress={progress}
        activeSuggestion={activeSuggestion}
      />

      <StatusTray
        currentPath={currentPath}
        andonData={andonData}
        andonState={andonState}
        version={version}
      />
    </Box>
  );
}
