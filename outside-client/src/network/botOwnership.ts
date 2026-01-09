/**
 * Tracks which client controls which bot
 */
export class BotOwnershipTracker {
  private ownership: Map<string, string> = new Map(); // clientId -> botId
  private availableBots: Set<string> = new Set();

  /**
   * Set available bots (called when game starts)
   */
  setAvailableBots(botIds: string[]): void {
    this.availableBots = new Set(botIds);
  }

  /**
   * Assign a bot to a client
   * Returns the bot ID if assignment was successful, null otherwise
   */
  assignBot(clientId: string, botId?: string): string | null {
    // If botId is provided, try to assign that specific bot
    if (botId) {
      if (!this.availableBots.has(botId)) {
        console.warn(`[BotOwnership] Bot ${botId} is not available`);
        return null;
      }
      // Check if bot is already assigned
      for (const [cid, bid] of this.ownership.entries()) {
        if (bid === botId && cid !== clientId) {
          console.warn(`[BotOwnership] Bot ${botId} is already assigned to ${cid}`);
          return null;
        }
      }
      this.ownership.set(clientId, botId);
      return botId;
    }

    // Otherwise, assign first available bot
    for (const botId of this.availableBots) {
      let isAssigned = false;
      for (const assignedBotId of this.ownership.values()) {
        if (assignedBotId === botId) {
          isAssigned = true;
          break;
        }
      }
      if (!isAssigned) {
        this.ownership.set(clientId, botId);
        return botId;
      }
    }

    console.warn(`[BotOwnership] No available bots for client ${clientId}`);
    return null;
  }

  /**
   * Get the bot ID controlled by a client
   */
  getBotId(clientId: string): string | null {
    return this.ownership.get(clientId) || null;
  }

  /**
   * Unassign a bot from a client
   */
  unassignBot(clientId: string): void {
    this.ownership.delete(clientId);
  }

  /**
   * Get all ownership mappings
   */
  getAllOwnership(): Map<string, string> {
    return new Map(this.ownership);
  }

  /**
   * Clear all ownership
   */
  clear(): void {
    this.ownership.clear();
  }
}
