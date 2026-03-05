import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class DevContext extends BaseContext {
  getContextCommands(): string[] {
    return ["tracks"];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens[0] === "tracks") {
      return { isInternal: true, command: "cd", args: ["tracks"], options: {} };
    }
    return null;
  }
}
