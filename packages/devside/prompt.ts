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

    // 1. Show list only on down arrow if it's currently hidden
    if (event.name === 'down' && !that.settings.list) {
      that.settings.list = true;
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
