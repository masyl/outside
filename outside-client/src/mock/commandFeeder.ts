import { CommandQueue } from '../commands/queue';
import { ParsedCommand } from '../commands/parser';
import { parseLevelFile } from '../level/parser';

/**
 * Command feeder that loads commands from level files
 */
export class MockCommandFeeder {
  private commandQueue: CommandQueue;
  private levelCommands: { terrain: ParsedCommand[]; bots: ParsedCommand[] } | null = null;

  constructor(commandQueue: CommandQueue) {
    this.commandQueue = commandQueue;
  }

  /**
   * Load level file and parse commands
   * Should be called before getInitialTerrainCommands or feedBotCommands
   */
  async loadLevel(levelPath: string = '/levels/demo.md'): Promise<void> {
    this.levelCommands = await parseLevelFile(levelPath);
    console.log(`[CommandFeeder] Loaded level: ${levelPath}`);
    console.log(`[CommandFeeder] Terrain commands: ${this.levelCommands.terrain.length}`);
    console.log(`[CommandFeeder] Bot commands: ${this.levelCommands.bots.length}`);
  }

  /**
   * Get all initial terrain commands to be processed immediately before game loop starts
   * These commands should be executed synchronously to render terrain instantly
   */
  getInitialTerrainCommands(): ParsedCommand[] {
    if (!this.levelCommands) {
      console.warn('[CommandFeeder] Level not loaded, returning empty terrain commands');
      return [];
    }
    return this.levelCommands.terrain;
  }

  /**
   * Feed bot commands to the queue
   * These commands will be executed by the game loop at 125ms intervals
   */
  feedBotCommands(): void {
    if (!this.levelCommands) {
      console.warn('[CommandFeeder] Level not loaded, cannot feed bot commands');
      return;
    }

    for (const command of this.levelCommands.bots) {
      this.commandQueue.enqueue(command);
    }
  }
}
