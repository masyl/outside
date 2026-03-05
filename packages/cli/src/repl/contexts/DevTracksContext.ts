import { IContext, CommandExecution } from "./types.ts";

export class DevTracksContext implements IContext {
  getAvailableCommands(): string[] {
    return ["list", "create", "destroy", "help", "quit", "clear"];
  }

  getAutocomplete(tokens: string[], routeParams: Record<string, string>): string[] {
    // Ideally we would fetch the list of autocomplete tracks from a backend
    // but we can return dynamic items combined with commands for now.
    return this.getAvailableCommands();
  }

  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens.length === 0) return null;

    if (["help", "quit", "clear", "cd"].includes(tokens[0])) {
      return { isInternal: true, command: tokens[0], args: tokens.slice(1), options: {} };
    }

    if (["list", "create", "destroy"].includes(tokens[0])) {
      return { isInternal: false, command: "track", args: [tokens[0], ...tokens.slice(1)], options: {} };
    }

    // Implicit cd into a track (assumed to be a trackName input instead of a command)
    return { isInternal: true, command: "cd", args: [`/dev/tracks/${tokens[0]}`], options: {} };
  }
}
