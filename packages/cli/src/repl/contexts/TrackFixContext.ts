import { IContext, CommandExecution } from "./types.ts";

export class TrackFixContext implements IContext {
  getAvailableCommands(): string[] {
    return ["worktree", "branch", "proxy", "help", "quit", "clear"];
  }

  getAutocomplete(tokens: string[], routeParams: Record<string, string>): string[] {
    return this.getAvailableCommands();
  }

  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens.length === 0) return null;

    if (["help", "quit", "clear", "cd"].includes(tokens[0])) {
      return { isInternal: true, command: tokens[0], args: tokens.slice(1), options: {} };
    }

    if (["worktree", "branch", "proxy"].includes(tokens[0])) {
      return { isInternal: false, command: `track-fix-${tokens[0]}`, args: [routeParams.trackName || ""], options: {} };
    }

    return null;
  }
}
