import { GameObject, WorldState, Direction } from '@outside/core';
import { Random } from './random';
import { GameCommand } from '../commands/queue';

/**
 * Handles autonomous behavior for bots
 */
export class BotAutonomy {
  private random: Random;

  constructor(seed: number) {
    this.random = new Random(seed);
  }

  /**
   * Decide on an action for a bot
   * Returns a command or null if no action should be taken
   */
  decideAction(bot: GameObject, world: WorldState): GameCommand | null {
    // 1/6th chance to wait (do nothing)
    if (this.random.chance(1/6)) {
      return null;
    }

    // Otherwise move in a random direction
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    const direction = this.random.choice(directions);

    if (direction) {
      return {
        type: 'move',
        id: bot.id,
        direction,
        distance: 1,
      };
    }

    return null;
  }
}
