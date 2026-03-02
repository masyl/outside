import { Input } from 'jsr:@cliffy/prompt@^1.0.0';
import type { KeyCode } from 'jsr:@cliffy/keycode@^1.0.0';

export class DevsideInput extends Input {
  public static override prompt(options: string | any): Promise<string> {
    return new this(options).prompt();
  }

  // 1. Shorthand/History Interceptor
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

    // 2. Alt/Option+Key Shorthands Support
    // On macOS, terminals often swallow the Alt/Option key to produce special characters
    // (e.g., Alt+t = †). We check for these explicit characters as well as the standard altKey.
    const macOptionMap: Record<string, string> = {
      '†': 't', // Alt + t
      'ß': 's', // Alt + s
      'ƒ': 'f', // Alt + f
      '∑': 'w', // Alt + w
      '∫': 'b', // Alt + b
    };

    const isAlt = (event as any).altKey || (event as any).metaKey;
    const rawChar = event.sequence || event.char || '';
    
    let shorthandTrigger = '';
    if (isAlt && event.char) {
        shorthandTrigger = event.char.toLowerCase();
    } else if (macOptionMap[rawChar]) {
        shorthandTrigger = macOptionMap[rawChar];
    }

    if (shorthandTrigger && typeof that.inputValue === 'string' && that.inputValue === '') {
      const validShorthands = ['t', 's', 'f', 'w', 'b'];
      
      if (validShorthands.includes(shorthandTrigger)) {
        that.inputValue = shorthandTrigger;
        that.inputIndex = 1;
        if (typeof that.render === 'function') that.render();
        
        // Dispatch synthetic Enter event to execute immediately
        await super.handleEvent({ name: 'enter' } as KeyCode);
        return;
      }
    }

    // 3. Submit the currently highlighted suggestion on Enter immediately
    if (event.name === 'enter' || event.name === 'return') {
      if (that.settings.list && that.suggestions.length > 0 && that.suggestionsIndex >= 0) {
        const suggestion = that.suggestions[that.suggestionsIndex]?.toString();
        if (suggestion) {
          that.inputValue = suggestion;
          that.inputIndex = that.inputValue.length;
        }
      }
    }

    await super.handleEvent(event);
  }
}
