export interface CommandExecution {
  command: string;
  args: string[];
  options: Record<string, string>;
  isInternal?: boolean;
}

export interface IContext {
  getAvailableCommands(): string[];
  translateInput(tokens: string[], routeParams: Record<string, string>): CommandExecution | null;
  getAutocomplete(tokens: string[], routeParams: Record<string, string>): Promise<string[]> | string[];
}
