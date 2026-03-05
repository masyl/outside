import { IContext, CommandExecution } from "./types.ts";

export abstract class BaseContext implements IContext {
  /**
   * Return only context-specific commands. 
   * Global commands (list, ls, chdir, cd, help, quit, clear, status) are added automatically.
   */
  abstract getContextCommands(): string[];

  getAvailableCommands(): string[] {
    const globals = ["list", "ls", "chdir", "cd", "help", "quit", "clear", "andon", "status", "reboot", "track"];
    const locals = this.getContextCommands();
    // Use a Set to avoid duplicates if a local command overrides a global (though unlikely for now)
    return Array.from(new Set([...globals, ...locals]));
  }

  getAutocomplete(tokens: string[], routeParams: Record<string, string>): string[] | Promise<string[]> {
    return this.getAvailableCommands();
  }

  /**
   * Subclasses should override this to handle their specific logic.
   * If it returns null, BaseContext handles global commands.
   */
  abstract translateContextInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null;

  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null {
    if (tokens.length === 0) return null;

    const command = tokens[0];

    // 1. Try context-specific translation first
    const contextExec = this.translateContextInput(tokens, routeParams);
    if (contextExec) return contextExec;

    // 2. Handle Global Commands
    if (["help", "quit", "clear", "cd", "chdir", "reboot"].includes(command)) {
      const internalCmd = command === "chdir" ? "cd" : command;
      return { isInternal: true, command: internalCmd, args: tokens.slice(1), options: {} };
    }

    if (command === "list" || command === "ls" || command === "track") {
      const isList = command === "list" || command === "ls";
      const actualCommand = isList ? "track" : command;
      const actualArgs = isList ? ["list", ...tokens.slice(1)] : tokens.slice(1);
      
      return { 
        isInternal: false, 
        command: actualCommand, 
        args: actualArgs, 
        options: {} 
      };
    }

    if (tokens[0] === "status" || tokens[0] === "andon") {
      return { isInternal: true, command: "andon", args: tokens.slice(1), options: {} };
    }

    return null;
  }
}
