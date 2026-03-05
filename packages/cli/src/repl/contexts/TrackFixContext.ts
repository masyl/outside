import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class TrackFixContext extends BaseContext {
  getContextCommands(): string[] {
    return ["worktree", "branch", "proxy"];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (["worktree", "branch", "proxy"].includes(tokens[0])) {
      return { isInternal: false, command: `track-fix-${tokens[0]}`, args: [routeParams.trackName || ""], options: {} };
    }
    return null;
  }
}
