import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class DevTracksContext extends BaseContext {
  getContextCommands(): string[] {
    return ["create", "destroy"];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (["list", "ls", "create", "destroy"].includes(tokens[0])) {
      const command = tokens[0] === "ls" ? "list" : tokens[0];
      return { isInternal: false, command: "track", args: [command, ...tokens.slice(1)], options: {} };
    }

    if (tokens[0] === "status" || tokens[0] === "andon") {
      return { isInternal: false, command: "track", args: ["list", ...tokens.slice(1)], options: {} };
    }

    return null;
  }
}
