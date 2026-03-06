import { createRouter, RadixRouter } from "npm:radix3";
import { IContext, CommandExecution } from "./contexts/types.ts";
import { RootContext } from "./contexts/RootContext.ts";
import { DevContext } from "./contexts/DevContext.ts";
import { DevTracksContext } from "./contexts/DevTracksContext.ts";
import { TrackContext } from "./contexts/TrackContext.ts";
import { TrackFixContext } from "./contexts/TrackFixContext.ts";

// Re-export CommandExecution to avoid breaking Executor imports
export type { CommandExecution };

export interface RouteHandler {
  context: IContext;
  autorun?: string;
}

export class ContextRouter {
  private router: RadixRouter<RouteHandler>;
  private currentPath: string = "/";

  constructor() {
    this.router = createRouter<RouteHandler>();

    // Instantiate context instances
    const rootCtx = new RootContext();
    const devCtx = new DevContext();
    const devTracksCtx = new DevTracksContext();
    const trackCtx = new TrackContext();
    const trackFixCtx = new TrackFixContext();

    // Map URL routes to specific context instances
    this.router.insert("/", { context: rootCtx });
    this.router.insert("/dev", { context: devCtx });
    this.router.insert("/dev/tracks", { context: devTracksCtx });
    this.router.insert("/dev/tracks/:trackName", { context: trackCtx, autorun: "status" });
    this.router.insert("/dev/tracks/:trackName/fix", { context: trackFixCtx });
  }

  /**
   * Retrieves the currently matched route handler, including parsed variables
   */
  private getMatch(path: string) {
    return this.router.lookup(path);
  }

  public getAutorun(): string | null {
    const match = this.getMatch(this.currentPath);
    return match?.autorun || null;
  }

  public getAvailableCommands(): string[] {
    const match = this.getMatch(this.currentPath);
    if (!match || !match.context) return [];
    return match.context.getAvailableCommands();
  }

  public async getAutocomplete(input: string): Promise<string[]> {
    const match = this.getMatch(this.currentPath);
    if (!match || !match.context) return [];
    
    // We pass empty tokens array basically letting context dictate logic
    const tokens = input.split(" ").filter(Boolean);
    const result = await match.context.getAutocomplete(tokens, match.params || {});
    return result;
  }

  public async getListData(): Promise<Record<string, string[]>> {
    const match = this.getMatch(this.currentPath);
    if (!match || !match.context) return {};
    if (match.context.getListData) {
      return await match.context.getListData(match.params || {});
    }
    return {};
  }

  public translate(input: string): CommandExecution | null {
    const tokens = input.split(" ").filter(Boolean);
    if (tokens.length === 0) return null;

    const match = this.getMatch(this.currentPath);
    if (!match || !match.context) return null;

    return match.context.translateInput(tokens, match.params || {});
  }

  /**
   * Attempts to cd based on relative or absolute bash logic.
   */
  public cd(path: string): boolean {
    let newPath = this.currentPath;
    if (path.startsWith("/")) {
      newPath = path;
    } else {
      if (path === "..") {
        const parts = newPath.split("/").filter(Boolean);
        parts.pop();
        newPath = "/" + parts.join("/");
      } else {
        newPath = this.currentPath.endsWith("/") ? this.currentPath + path : this.currentPath + "/" + path;
      }
    }

    if (!newPath.startsWith("/")) newPath = "/" + newPath;
    if (newPath.length > 1 && newPath.endsWith("/")) newPath = newPath.slice(0, -1);

    // Validate if it matches a valid route inside radix3
    const match = this.getMatch(newPath);
    if (!match) return false;

    this.currentPath = newPath;
    return true;
  }

  public getCurrentPath(): string {
    return this.currentPath;
  }
}
