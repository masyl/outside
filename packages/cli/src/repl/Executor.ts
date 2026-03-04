import { CommandExecution } from "./Router.ts";
import { exists } from "jsr:@std/fs@1";

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
    // In our architecture, commands are Deno scripts.
    // E.g. command 'track' -> `deno run -A src/commands/track.ts` 
    // Wait, the plan says every command is a standalone script but currently we only
    // put track list/create/destroy in src/commands/track/list.ts etc.
    // For now, since we have an entrypoint, we can just run the specific script.
    
    // Simplest approach: run the command binary using Deno.
    // If command is 'track', we need a track.ts router command, or we directly invoke `src/commands/...`
    // Let's assume the router maps `track-list` instead of `track list` or we just call bin.ts
    // For now, let's just mock the resolution or assume the CLI exposes `outside-cli track list`
    
    const scriptPath = `src/commands/${exec.command.replaceAll("-", "/")}.ts`;
    
    // Check if script exists gracefully before spawning Deno to avoid raw module not found errors
    const scriptExists = await exists(scriptPath);
    if (!scriptExists) {
      onEvent({ type: "error", message: `Command module not found: ${scriptPath}` });
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
