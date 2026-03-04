/**
 * Defines a Command execution blueprint.
 */
export interface CommandExecution {
  command: string;     // e.g. 'track-list', 'track-create'
  args: string[];      // positional arguments
  options: Record<string, string | boolean>; // parsed flags
}

/**
 * Defines an autocomplete pre-fetcher contract for a context.
 */
export interface ContextAutocomplete {
  fetchSubEntities: (params: Record<string, string>) => Promise<string[]>;
}

export interface RouteDefinition {
  pattern: string;
  // What commands are available to run or cd into from this context
  availableCommands: string[];
  // Given user input inside this context, translate into an execution plan
  translateInput?: (inputTokens: string[], params: Record<string, string>) => CommandExecution | null;
  autocomplete?: ContextAutocomplete;
  autorun?: string;
}

/**
 * ContextRouter maps logical URL-like contexts to physical CLI commands.
 */
export class ContextRouter {
  private routes: { pattern: URLPattern; def: RouteDefinition }[] = [];
  private currentPath: string = "/";

  constructor() {
    // Base standard routes
    this.register({
      pattern: "/",
      availableCommands: ["track", "help", "quit", "clear"],
      translateInput: (tokens) => {
        if (tokens.length === 0) return null;
        // If they type `track <name>`, it's an implicit cd to the track context
        if (tokens[0] === "track" && tokens.length > 1 && !["list", "create", "destroy"].includes(tokens[1])) {
           return { command: "cd", args: [`/track/${tokens[1]}`], options: {} };
        }
        // At root, commands are basically 1:1
        return { command: tokens[0], args: tokens.slice(1), options: {} };
      }
    });

    this.register({
      pattern: "/track",
      availableCommands: ["list", "create", "destroy"],
      translateInput: (tokens) => {
        if (tokens.length === 0) return null;
        // If they type a track name directly, implicit cd to that track
        if (!["list", "create", "destroy"].includes(tokens[0])) {
           return { command: "cd", args: [`/track/${tokens[0]}`], options: {} };
        }
        // From /track, running "list" translates to "track list"
        return { command: "track", args: [tokens[0], ...tokens.slice(1)], options: {} };
      },
      autocomplete: {
        fetchSubEntities: async () => {
          // In a full implementation, we might call 'track list --json' to get these
          // For now, return dynamic placeholder logic
          return ["my-track", "devops"];
        }
      }
    });

    this.register({
      pattern: "/track/:trackName",
      availableCommands: ["destroy", "fix", "status"],
      autorun: "status",
      translateInput: (tokens, params) => {
        if (tokens.length === 0) return null;
        if (tokens[0] === "destroy") {
           return { command: "track", args: ["destroy", params.trackName], options: {} };
        }
        if (tokens[0] === "fix" && tokens[1]) {
           // track-fix-worktree or track-fix-branch
           return { command: `track-fix-${tokens[1]}`, args: [params.trackName], options: {} };
        }
        return { command: "track", args: [tokens[0], params.trackName, ...tokens.slice(1)], options: {} };
      }
    });
  }

  public getAutorun(): string | null {
    const route = this.matchRoute(this.currentPath);
    return route?.def.autorun || null;
  }

  public register(def: RouteDefinition) {
    // We use a dummy base URL since URLPattern requires a base for absolute path string matching
    const pattern = new URLPattern({ pathname: def.pattern });
    this.routes.push({ pattern, def });
  }

  /**
   * Attempts to change context based on string input (e.g. 'cd track/foo')
   */
  public cd(path: string): boolean {
    // Resolve path similar to bash cd
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

    // Ensure it's clean
    if (!newPath.startsWith("/")) newPath = "/" + newPath;
    if (newPath.length > 1 && newPath.endsWith("/")) newPath = newPath.slice(0, -1);

    // Validate if it matches a valid route
    const match = this.matchRoute(newPath);
    if (!match) return false;

    this.currentPath = newPath;
    return true;
  }

  public getCurrentPath(): string {
    return this.currentPath;
  }

  public getAvailableCommands(): string[] {
    const route = this.matchRoute(this.currentPath);
    return route ? route.def.availableCommands : [];
  }

  public translate(input: string): CommandExecution | null {
    const tokens = input.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return null;

    if (tokens[0] === "cd" && tokens[1]) {
      // cd is handled internally by the REPL, but we can emit a distinct execution for it
      return { command: "cd", args: [tokens[1]], options: {} };
    }

    const route = this.matchRoute(this.currentPath);
    if (!route || !route.def.translateInput) return null;

    return route.def.translateInput(tokens, route.match.pathname.groups as Record<string, string>);
  }

  private matchRoute(path: string) {
    const fakeUrl = `http://dummy.com${path}`;
    for (const route of this.routes) {
      const match = route.pattern.exec(fakeUrl);
      if (match) {
        return { match, def: route.def };
      }
    }
    return null;
  }
}
