import { IContext, CommandExecution } from "./types.ts";

export class TrackContext implements IContext {
  getAvailableCommands(): string[] {
    return ["status", "destroy", "fix", "help", "quit", "clear"];
  }

  getAutocomplete(tokens: string[], routeParams: Record<string, string>): string[] {
    return this.getAvailableCommands();
  }

  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens.length === 0) return null;

    if (["help", "quit", "clear", "cd"].includes(tokens[0])) {
      return { isInternal: true, command: tokens[0], args: tokens.slice(1), options: {} };
    }

    if (tokens[0] === "destroy") {
      return { isInternal: false, command: "track", args: ["destroy", routeParams.trackName || ""], options: {} };
    }

    if (tokens[0] === "status") {
      return { isInternal: false, command: "track", args: ["status", routeParams.trackName || ""], options: {} };
    }

    if (tokens[0] === "fix") {
      return { isInternal: true, command: "cd", args: [`/dev/tracks/${routeParams.trackName}/fix`], options: {} };
    }

    // Unrecognized track commands could be caught, or returned as null
    return null;
  }
}
