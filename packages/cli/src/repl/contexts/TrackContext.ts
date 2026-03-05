import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class TrackContext extends BaseContext {
  getContextCommands(): string[] {
    return ["status", "destroy", "fix"];
  }

  translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens[0] === "destroy") {
      return { isInternal: false, command: "track", args: ["destroy", routeParams.trackName || ""], options: {} };
    }

    if (tokens[0] === "status") {
      return { isInternal: false, command: "track", args: ["status", routeParams.trackName || ""], options: {} };
    }

    if (tokens[0] === "fix") {
      return { isInternal: true, command: "cd", args: [`/dev/tracks/${routeParams.trackName}/fix`], options: {} };
    }

    return null;
  }
}
