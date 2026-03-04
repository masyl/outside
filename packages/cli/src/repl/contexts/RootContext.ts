import { IContext, CommandExecution } from "./types.ts";

export class RootContext implements IContext {
  getAvailableCommands(): string[] {
    return ["dev", "mesh", "help", "quit", "clear"];
  }

  getAutocomplete(tokens: string[], routeParams: Record<string, string>): string[] {
    return this.getAvailableCommands();
  }

  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens.length === 0) return null;

    if (["dev", "mesh"].includes(tokens[0])) {
      return { isInternal: true, command: "cd", args: [tokens[0]], options: {} };
    }

    if (["help", "quit", "clear", "cd"].includes(tokens[0])) {
      return { isInternal: true, command: tokens[0], args: tokens.slice(1), options: {} };
    }

    return null;
  }
}
