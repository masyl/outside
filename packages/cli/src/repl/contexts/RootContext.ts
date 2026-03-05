import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class RootContext extends BaseContext {
  getContextCommands(): string[] {
    return ["dev", "mesh"];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (["dev", "mesh"].includes(tokens[0])) {
      return { isInternal: true, command: "cd", args: [tokens[0]], options: {} };
    }
    return null;
  }
}
