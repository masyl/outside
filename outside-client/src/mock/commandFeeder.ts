import { CommandQueue } from '../commands/queue';
import { parseCommand } from '../commands/parser';

/**
 * Mock command feeder that runs initial commands programmatically
 */
export class MockCommandFeeder {
  private commandQueue: CommandQueue;

  constructor(commandQueue: CommandQueue) {
    this.commandQueue = commandQueue;
  }

  /**
   * Feed the initial commands to the queue
   * Creates 3 bots at different positions
   * Commands will be executed by the game loop at 500ms intervals
   */
  feedInitialCommands(): void {
    // Bot 1: fido at (5, 4)
    const cmd1 = parseCommand('create bot fido');
    this.commandQueue.enqueue(cmd1);
    const cmd2 = parseCommand('place fido 5 4');
    this.commandQueue.enqueue(cmd2);

    // Bot 2: alice at (10, 8)
    const cmd3 = parseCommand('create bot alice');
    this.commandQueue.enqueue(cmd3);
    const cmd4 = parseCommand('place alice 10 8');
    this.commandQueue.enqueue(cmd4);

    // Bot 3: bob at (15, 2)
    const cmd5 = parseCommand('create bot bob');
    this.commandQueue.enqueue(cmd5);
    const cmd6 = parseCommand('place bob 15 2');
    this.commandQueue.enqueue(cmd6);
  }
}
