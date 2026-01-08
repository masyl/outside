import { ParsedCommand } from './parser';

/**
 * Command queue for the game loop
 */
export class CommandQueue {
  private queue: ParsedCommand[] = [];

  /**
   * Add a command to the queue
   */
  enqueue(command: ParsedCommand): void {
    this.queue.push(command);
  }

  /**
   * Add multiple commands to the queue
   */
  enqueueMany(commands: ParsedCommand[]): void {
    this.queue.push(...commands);
  }

  /**
   * Get and remove the next command from the queue
   */
  dequeue(): ParsedCommand | null {
    return this.queue.shift() || null;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get queue length
   */
  length(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }
}
