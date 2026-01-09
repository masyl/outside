import { CommandQueue } from '../commands/queue';
import { parseCommand, ParsedCommand } from '../commands/parser';

/**
 * Mock command feeder that runs initial commands programmatically
 */
export class MockCommandFeeder {
  private commandQueue: CommandQueue;

  constructor(commandQueue: CommandQueue) {
    this.commandQueue = commandQueue;
  }

  /**
   * Get all initial terrain commands to be processed immediately before game loop starts
   * Creates terrain covering ~75% of the 20x10 grid
   * These commands should be executed synchronously to render terrain instantly
   */
  getInitialTerrainCommands(): ParsedCommand[] {
    // Create terrain first (covering ~75% of 20x10 = 150 tiles, ~112 tiles)
    // Mix of grass, dirt, water, sand, holes
    // Leave some empty spots (no terrain)
    
    const terrainCommands: ParsedCommand[] = [];
    
    // Dirt patches (walkable)
    terrainCommands.push(parseCommand('create terrain dirt dirt2 0 0 2 10')); // 16 tiles
    // terrainCommands.push(parseCommand('create terrain dirt dirt1 6 0 4 4')); // 16 tiles

    // Water (not walkable)
    terrainCommands.push(parseCommand('create terrain water water1 8 1 10 9')); // 20 tiles
    
    // Grass patches (walkable)
    terrainCommands.push(parseCommand('create terrain grass grass1 2 0 6 10')); // 36 tiles
    terrainCommands.push(parseCommand('create terrain grass grass2 8 0 10 1')); // 36 tiles
    terrainCommands.push(parseCommand('create terrain grass grass3 0 8 5 2')); // 10 tiles
    
    // Sand patches (walkable)
    terrainCommands.push(parseCommand('create terrain sand sand1 2 6 3 2')); // 16 tiles
    terrainCommands.push(parseCommand('create terrain sand sand2 5 4 8 6')); // 10 tiles
    
    // Holes (not walkable)
    terrainCommands.push(parseCommand('create terrain hole hole1 8 6 2 2')); // 16 tiles
    
    
    // Total terrain: 36 + 16 + 10 + 16 + 16 + 20 + 16 + 10 + 16 = 156 tiles (104% of grid, but with overlaps)
    // Actual coverage will be less due to overlaps, leaving some empty spots
    
    return terrainCommands;
  }

  /**
   * Feed bot commands to the queue
   * These commands will be executed by the game loop at 125ms intervals
   */
  feedBotCommands(): void {
    // Create bots
    this.commandQueue.enqueue(parseCommand('create bot fido'));
    this.commandQueue.enqueue(parseCommand('create bot alice'));
    this.commandQueue.enqueue(parseCommand('create bot bob'));
    
    // Place bots on walkable terrain (grass, dirt, or sand)
    // Position (2, 2) should be on grass1 (walkable)
    this.commandQueue.enqueue(parseCommand('place fido 2 2'));
    
    // Position (7, 2) should be on dirt1 (walkable)
    this.commandQueue.enqueue(parseCommand('place alice 7 2'));
    
    // Position (2, 7) should be on sand1 (walkable)
    this.commandQueue.enqueue(parseCommand('place bob 2 7'));
  }
}
