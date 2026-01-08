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
   * Feed the initial three commands to the queue
   * Commands will be executed by the game loop at 500ms intervals
   */
  feedInitialCommands(): void {
    // Command 1: create bot fido (will execute at step 0, immediately)
    const cmd1 = parseCommand('create bot fido');
    this.commandQueue.enqueue(cmd1);

    // Command 2: place fido 10 8 (will execute at step 1, 500ms later)
    const cmd2 = parseCommand('place fido 10 8');
    this.commandQueue.enqueue(cmd2);

    // Command 3: move fido right 4 (will execute at step 2, 1000ms later)
    const cmd3 = parseCommand('move fido right 4');
    this.commandQueue.enqueue(cmd3);
  }
}
