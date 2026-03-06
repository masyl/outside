import { BaseContext } from "./BaseContext.ts";
import { CommandExecution } from "./types.ts";

export class DevTracksContext extends BaseContext {
  getContextCommands(): string[] {
    return ["create", "destroy"];
  }

  async getListData(routeParams: Record<string, string>): Promise<Record<string, string[]>> {
    const base = await super.getListData(routeParams);
    const tracks: string[] = [];
    try {
      const dirPath = `${Deno.cwd()}/.tracks`;
      for await (const entry of Deno.readDir(dirPath)) {
        if (entry.isDirectory) {
          tracks.push(entry.name);
        }
      }
    } catch (_) {}
    
    if (tracks.length > 0) {
      base["Tracks"] = tracks.sort();
    }
    return base;
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
