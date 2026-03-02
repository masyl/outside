import { Input } from 'jsr:@cliffy/prompt@^1.0.0';
import type { KeyCode } from 'jsr:@cliffy/keycode@^1.0.0';

export class DevsideInput extends Input {
  public static override prompt(options: string | any): Promise<string> {
    return new this(options).prompt();
  }

  protected override async handleEvent(event: KeyCode): Promise<void> {
    const that = this as any;

    // 0. Return to neutral on Escape (hide list, clear input)
    if (event.name === 'escape') {
      let changed = false;
      if (that.settings.list) {
        that.settings.list = false;
        changed = true;
      }
      if (typeof that.inputValue === 'string' && that.inputValue.length > 0) {
        that.inputValue = '';
        that.inputIndex = 0;
        changed = true;
      }
      
      if (changed && typeof that.render === 'function') {
        that.render();
      }
      return;
    }

    // Initialize history cursor on first event if we have history
    if (that.settings.history && that.historyIndex === undefined) {
      that.historyIndex = that.settings.history.length;
    }

    if (event.name === 'up') {
      if (!that.settings.list && that.settings.history && that.settings.history.length > 0) {
        if (that.historyIndex > 0) {
          that.historyIndex--;
          that.inputValue = that.settings.history[that.historyIndex];
          that.inputIndex = that.inputValue.length;
          if (typeof that.render === 'function') that.render();
        }
      } else {
        await super.handleEvent(event);
      }
      return;
    }

    if (event.name === 'down') {
      if (that.settings.list) {
        await super.handleEvent(event);
        return;
      }
      // If we are currently navigating history, go down to newer entries
      if (that.settings.history && that.historyIndex < that.settings.history.length) {
        that.historyIndex++;
        if (that.historyIndex >= that.settings.history.length) {
          that.inputValue = '';
          that.inputIndex = 0;
        } else {
          that.inputValue = that.settings.history[that.historyIndex];
          that.inputIndex = that.inputValue.length;
        }
        if (typeof that.render === 'function') that.render();
        return;
      }
      // If we are at the bottom of history (neutral), down arrow opens the menu
      that.settings.list = true;
      await super.handleEvent(event);
      return;
    }

    // 2. Submit the currently highlighted suggestion on Enter immediately
    if (event.name === 'enter' || event.name === 'return') {
      if (that.settings.list && that.suggestions.length > 0 && that.suggestionsIndex >= 0) {
        const suggestion = that.suggestions[that.suggestionsIndex]?.toString();
        if (suggestion) {
          // Set internal value so when it submits, it uses this exact word
          that.inputValue = suggestion;
          that.inputIndex = that.inputValue.length;
        }
      }
    }

    await super.handleEvent(event);
  }
}
