import { exists } from "jsr:@std/fs@1";
import { fromFileUrl } from "jsr:@std/path@1";
import { CommandExecution } from "./Router.ts";

export interface ExecutionEvent {
  type: "stdout" | "stderr" | "progress" | "done" | "error";
  message?: string;
  progress?: number;
  phase?: string;
  code?: number;
}

export async function executeCommand(
  exec: CommandExecution,
  onEvent: (event: ExecutionEvent) => void
) {
  try {
    // Commands are scripts in src/commands/
    // We resolve them relative to this file to be robust against CWD changes
    const scriptUrl = new URL(`../commands/${exec.command.replaceAll("-", "/")}.ts`, import.meta.url);
    const scriptPath = fromFileUrl(scriptUrl);

    // Check if script exists gracefully before spawning Deno to avoid raw module not found errors
    const scriptExists = await exists(scriptPath);
    if (!scriptExists) {
      onEvent({ type: "error", message: `Command module not found for '${exec.command}': ${scriptPath}` });
      onEvent({ type: "done", code: 1 });
      return;
    }

    const args = [
      "run", "-A",
      scriptPath,
      ...exec.args
    ];
    const cmd = new Deno.Command(Deno.execPath(), {
      args,
      stdout: "piped",
      stderr: "piped"
    });

    const child = cmd.spawn();

    // Async consume stdout line by line
    const consumeStream = async (stream: ReadableStream, isStderr: boolean) => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (!isStderr) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "progress") {
                onEvent({
                  type: "progress",
                  phase: parsed.phase,
                  progress: parsed.progress,
                  message: parsed.message
                });
              } else {
                // Stdout normal JSON payload (the final output)
                onEvent({ type: "stdout", message: line });
              }
            } catch {
              // Not JSON, just standard output
              onEvent({ type: "stdout", message: line });
            }
          } else {
            onEvent({ type: "stderr", message: line });
          }
        }
      }
    };

    consumeStream(child.stdout, false);
    consumeStream(child.stderr, true);

    const status = await child.status;
    onEvent({ type: "done", code: status.code });
  } catch (err: any) {
    onEvent({ type: "error", message: err.message });
  }
}
