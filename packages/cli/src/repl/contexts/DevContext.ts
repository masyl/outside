import { IContext, CommandExecution } from "./types.ts";

export class DevContext implements IContext {
  getAvailableCommands(): string[] {
    return ["tracks", "help", "quit", "clear"];
  }

  getAutocomplete(tokens: string[], routeParams: Record<string, string>): string[] {
    return this.getAvailableCommands();
  }

  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens.length === 0) return null;

    if (tokens[0] === "tracks") {
      return { isInternal: true, command: "cd", args: ["tracks"], options: {} };
    }

    if (["help", "quit", "clear", "cd"].includes(tokens[0])) {
      return { isInternal: true, command: tokens[0], args: tokens.slice(1), options: {} };
    }

    return null;
  }
}
