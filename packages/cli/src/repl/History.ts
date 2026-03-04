import { ensureDir } from "jsr:@std/fs@1";
import { join } from "jsr:@std/path@1";

export class CommandHistory {
  private historyFile: string;
  private memory: string[] = [];
  private pointer: number = 0;

  constructor() {
    // Determine user config path. Normally we put this in home dir or project dir.
    // The spec says project root for config, let's use `.outside_cli_history` in CWD 
    // or fallback to $HOME.
    this.historyFile = join(Deno.cwd(), ".outside_cli_history");
  }

  public async load() {
    try {
      const data = await Deno.readTextFile(this.historyFile);
      this.memory = data.split("\n").filter(Boolean);
      this.pointer = this.memory.length;
    } catch {
      this.memory = [];
      this.pointer = 0;
    }
  }

  public async push(command: string) {
    if (!command.trim()) return;
    
    // Simple dedup of consecutive identical commands
    if (this.memory.length > 0 && this.memory[this.memory.length - 1] === command) {
        this.pointer = this.memory.length;
        return;
    }

    this.memory.push(command);
    
    // Keep last 1000
    if (this.memory.length > 1000) {
      this.memory.shift();
    }
    this.pointer = this.memory.length;

    try {
      await Deno.writeTextFile(this.historyFile, this.memory.join("\n") + "\n");
    } catch (err) {
      // Ignore if can't write
    }
  }

  public getPreviousCommand(): string | null {
    if (this.pointer > 0) {
      this.pointer--;
      return this.memory[this.pointer];
    }
    return null;
  }

  public getNextCommand(): string | null {
    if (this.pointer < this.memory.length - 1) {
      this.pointer++;
      return this.memory[this.pointer];
    } else if (this.pointer === this.memory.length - 1) {
      this.pointer++;
      return ""; // Blank prompt when pushing past newest
    }
    return null;
  }
}
