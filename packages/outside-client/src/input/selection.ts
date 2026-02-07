import { WorldState, Bot } from '@outside/core';

/**
 * Manages the currently selected bot (client-only UI state)
 */
export class SelectionManager {
  private selectedBotId: string | null = null;

  /**
   * Select a bot by ID
   */
  selectBot(id: string): void {
    this.selectedBotId = id;
  }

  /**
   * Set the selected bot ID (alias for selectBot for consistency)
   */
  setSelectedBotId(id: string | null): void {
    this.selectedBotId = id;
  }

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    this.selectedBotId = null;
  }

  /**
   * Get the currently selected bot ID
   */
  getSelectedBotId(): string | null {
    return this.selectedBotId;
  }

  /**
   * Cycle to the next bot (forward)
   */
  cycleNext(world: WorldState): string | null {
    const botIds = Array.from(world.objects.values())
      .filter((obj): obj is Bot => obj.type === 'bot')
      .map((bot) => bot.id)
      .sort();

    if (botIds.length === 0) {
      this.clearSelection();
      return null;
    }

    if (this.selectedBotId === null) {
      // No selection, select first bot
      this.selectedBotId = botIds[0];
      return this.selectedBotId;
    }

    const currentIndex = botIds.indexOf(this.selectedBotId);
    if (currentIndex === -1) {
      // Selected bot no longer exists, select first
      this.selectedBotId = botIds[0];
      return this.selectedBotId;
    }

    // Cycle to next, wrap around to first if at end
    const nextIndex = (currentIndex + 1) % botIds.length;
    this.selectedBotId = botIds[nextIndex];
    return this.selectedBotId;
  }

  /**
   * Cycle to the previous bot (backward)
   */
  cyclePrevious(world: WorldState): string | null {
    const botIds = Array.from(world.objects.values())
      .filter((obj): obj is Bot => obj.type === 'bot')
      .map((bot) => bot.id)
      .sort();

    if (botIds.length === 0) {
      this.clearSelection();
      return null;
    }

    if (this.selectedBotId === null) {
      // No selection, select last bot
      this.selectedBotId = botIds[botIds.length - 1];
      return this.selectedBotId;
    }

    const currentIndex = botIds.indexOf(this.selectedBotId);
    if (currentIndex === -1) {
      // Selected bot no longer exists, select last
      this.selectedBotId = botIds[botIds.length - 1];
      return this.selectedBotId;
    }

    // Cycle to previous, wrap around to last if at start
    const prevIndex = currentIndex === 0 ? botIds.length - 1 : currentIndex - 1;
    this.selectedBotId = botIds[prevIndex];
    return this.selectedBotId;
  }
}
