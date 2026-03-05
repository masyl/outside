import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class DevTracksContext extends BaseContext {
  getContextCommands(): string[] {
    return ["list", "ls", "create", "destroy", "andon"];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (["list", "ls", "create", "destroy"].includes(tokens[0])) {
      const command = tokens[0] === "ls" ? "list" : tokens[0];
      return { isInternal: false, command: "track", args: [command, ...tokens.slice(1)], options: {} };
    }

    // Implicit cd into a track (assumed to be a trackName input instead of a command)
    // Only if it doesn't look like a global command
    const globals = ["help", "quit", "clear", "cd", "chdir", "status", "andon"];
    if (globals.includes(tokens[0])) return null;

    if (tokens[0] === "status" || tokens[0] === "andon") {
      const command = tokens[0] === "status" ? "list" : tokens[0];
      return { isInternal: false, command: "track", args: ["list", ...tokens.slice(1)], options: {} };
    }
    return { isInternal: true, command: "cd", args: [`/dev/tracks/${tokens[0]}`], options: {} };
  }
}
