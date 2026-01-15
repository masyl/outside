import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseCommand } from './parser';

describe('Command Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bot Creation Commands', () => {
    it('should parse create bot command', () => {
      const result = parseCommand('create bot test-bot');

      expect(result).toEqual({
        type: 'create',
        objectType: 'bot',
        id: 'test-bot',
      });
    });

    it('should parse create terrain command', () => {
      const result = parseCommand('create terrain grass terrain-1 5 3 2 2');

      expect(result).toEqual({
        type: 'create',
        objectType: 'terrain',
        id: 'terrain-1',
        terrainType: 'grass',
        x: 5,
        y: 3,
        width: 2,
        height: 2,
      });
    });

    it('should handle invalid create terrain command', () => {
      const result = parseCommand('create terrain invalid-type terrain-1 5 3 2 2');

      expect(result).toEqual({
        type: 'unknown',
        raw: 'create terrain invalid-type terrain-1 5 3 2 2',
      });
    });
  });

  describe('Bot Placement Commands', () => {
    it('should parse place command', () => {
      const result = parseCommand('place test-bot 10 5');

      expect(result).toEqual({
        type: 'place',
        id: 'test-bot',
        x: 10,
        y: 5,
      });
    });

    it('should handle invalid place command', () => {
      const result = parseCommand('place test-bot invalid-coord');

      expect(result).toEqual({
        type: 'unknown',
        raw: 'place test-bot invalid-coord',
      });
    });
  });

  describe('Bot Movement Commands', () => {
    it('should parse move up command', () => {
      const result = parseCommand('move current-bot up 1');

      expect(result).toEqual({
        type: 'move',
        id: 'current-bot',
        direction: 'up',
        distance: 1,
      });
    });

    it('should parse move diagonal command', () => {
      const result = parseCommand('move current-bot up-left 2');

      expect(result).toEqual({
        type: 'move',
        id: 'current-bot',
        direction: 'up-left',
        distance: 2,
      });
    });

    it('should handle invalid move command', () => {
      const result = parseCommand('move current-bot invalid-direction 1');

      expect(result).toEqual({
        type: 'unknown',
        raw: 'move current-bot invalid-direction 1',
      });
    });

    it('should handle invalid distance', () => {
      const result = parseCommand('move current-bot up not-a-number');

      expect(result).toEqual({
        type: 'unknown',
        raw: 'move current-bot up not-a-number',
      });
    });
  });

  describe('Command Edge Cases', () => {
    it('should handle empty command', () => {
      const result = parseCommand('');

      expect(result).toEqual({
        type: 'unknown',
        raw: '',
      });
    });

    it('should handle whitespace-only command', () => {
      const result = parseCommand('   \t\n   ');

      expect(result).toEqual({
        type: 'unknown',
        raw: '',
      });
    });

    it('should handle unknown command', () => {
      const result = parseCommand('unknown command here');

      expect(result).toEqual({
        type: 'unknown',
        raw: 'unknown command here',
      });
    });

    it('should handle malformed create commands', () => {
      const commands = [
        'create bot', // Missing ID
        'create unknown-type bot-id', // Unknown type
        'create terrain grass terrain-id', // Missing coordinates
        'create terrain grass terrain-id x y', // Invalid coordinates
        'terrain create bot-id', // Wrong command order
      ];

      commands.forEach((cmd) => {
        const result = parseCommand(cmd);
        expect(result.type).toBe('unknown');
        expect(result.raw).toBe(cmd.trim());
      });
    });

    it('should handle malformed move commands', () => {
      const commands = [
        'move', // Missing arguments
        'move current-bot', // Missing direction/distance
        'move current-bot up', // Missing distance
        'move current-bot 1', // Missing direction
        'bot move current-bot up 1', // Wrong command format
      ];

      commands.forEach((cmd) => {
        const result = parseCommand(cmd);
        expect(result.type).toBe('unknown');
        expect(result.raw).toBe(cmd.trim());
      });
    });

    it('should handle malformed place commands', () => {
      const commands = [
        'place', // Missing arguments
        'place bot-id', // Missing coordinates
        'place bot-id x', // Missing y coordinate
        'place bot-id x y z', // Too many arguments
        'place bot-id not-number not-number', // Invalid coordinates
      ];

      commands.forEach((cmd) => {
        const result = parseCommand(cmd);
        expect(result.type).toBe('unknown');
        expect(result.raw).toBe(cmd.trim());
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle parser errors gracefully', () => {
      // The parser should not throw on any input
      expect(() => {
        parseCommand('any command string');
      }).not.toThrow();
    });

    it('should return unknown type for unparseable input', () => {
      const result = parseCommand('create bot ' + 'x'.repeat(1000));

      // Should return unknown rather than throw
      expect(result.type).toBe('unknown');
      expect(typeof result.raw).toBe('string');
    });
  });

  describe('Command Structure Consistency', () => {
    it('should maintain consistent result structure', () => {
      const commands = ['create bot test-bot', 'place test-bot 5 3', 'move test-bot up 2'];

      commands.forEach((cmd) => {
        const result = parseCommand(cmd);

        // All results should have type and raw properties
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('raw');
        expect(typeof result.type).toBe('string');
        expect(typeof result.raw).toBe('string');
      });
    });

    it('should include appropriate payload properties', () => {
      const createResult = parseCommand('create bot test-bot');
      const placeResult = parseCommand('place test-bot 5 3');
      const moveResult = parseCommand('move test-bot up 2');

      // Create bot should have id
      expect(createResult).toHaveProperty('objectType');
      expect(createResult.objectType).toBe('bot');
      expect(createResult).toHaveProperty('id');
      expect(createResult.id).toBe('test-bot');

      // Place should have id and coordinates
      expect(placeResult).toHaveProperty('id');
      expect(placeResult).toHaveProperty('x');
      expect(placeResult).toHaveProperty('y');
      expect(placeResult.id).toBe('test-bot');
      expect(placeResult.x).toBe(5);
      expect(placeResult.y).toBe(3);

      // Move should have id, direction, and distance
      expect(moveResult).toHaveProperty('id');
      expect(moveResult).toHaveProperty('direction');
      expect(moveResult).toHaveProperty('distance');
      expect(moveResult.id).toBe('test-bot');
      expect(moveResult.direction).toBe('up');
      expect(moveResult.distance).toBe(2);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle case variations correctly', () => {
      const commands = [
        'CREATE BOT TEST-BOT',
        'Create Bot Test-Bot',
        'create bot TEST-BOT',
        'CrEaTe BoT TeSt-BoT',
      ];

      commands.forEach((cmd) => {
        const result = parseCommand(cmd);
        expect(result.type).toBe('create');
        expect(result.objectType).toBe('bot');
        expect(result.id).toBe('TEST-BOT');
      });
    });

    it('should preserve case in raw output', () => {
      const cmd = 'CrEaTe BoT TeSt-BoT';
      const result = parseCommand(cmd);

      expect(result.raw).toBe(cmd);
    });
  });
});
