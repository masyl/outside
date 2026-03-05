import { ensureDir } from "jsr:@std/fs@1";
import { join } from "jsr:@std/path@1";

export class CommandHistory {
  private historyFile: string;
  private memory: string[] = [];
  private pointer: number = 0;

  constructor() {
    // Determine user config path. Normally we put this in home dir or project dir.
    // or fallback to $HOME.
    const cliDir = join(Deno.cwd(), ".outside_cli");
    this.historyFile = join(cliDir, "history.txt");
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
      await ensureDir(join(Deno.cwd(), ".outside_cli"));
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
