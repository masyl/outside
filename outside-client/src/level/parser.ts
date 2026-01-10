import { parseCommand, ParsedCommand } from '../commands/parser';

export interface LevelCommands {
  terrain: ParsedCommand[];
  bots: ParsedCommand[];
}

/**
 * Parse a markdown level file
 * Extracts commands from code blocks under specific ## headings
 * Other markdown content is ignored (treated as comments)
 */
export async function parseLevelFile(filePath: string): Promise<LevelCommands> {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to load level file: ${response.statusText}`);
  }

  const markdown = await response.text();
  return parseLevelMarkdown(markdown);
}

/**
 * Parse markdown content and extract commands
 */
export function parseLevelMarkdown(markdown: string): LevelCommands {
  const result: LevelCommands = {
    terrain: [],
    bots: [],
  };

  // Split by ## headings
  const sections = markdown.split(/^##\s+/gm);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract heading and content
    const lines = section.split('\n');
    const heading = lines[0].trim().toLowerCase();
    const content = lines.slice(1).join('\n');

  // Extract commands from code blocks or plain text after heading
  const commands = extractCommands(content);

    if (heading === 'terrain') {
      result.terrain.push(...commands);
    } else if (heading === 'bots' || heading === 'bot') {
      result.bots.push(...commands);
    }
    // Other headings are ignored
  }

  return result;
}

/**
 * Extract command strings from markdown content
 * Supports both code blocks and plain text lines
 */
function extractCommands(content: string): ParsedCommand[] {
  const commands: ParsedCommand[] = [];

  // First, try to extract from code blocks
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeBlockContent = match[1];
    const lines = codeBlockContent.split('\n');
    for (const line of lines) {
      const trimmed = stripInlineComment(line);
      if (trimmed && !trimmed.startsWith('#')) {
        const parsed = parseCommand(trimmed);
        if (parsed.type !== 'unknown') {
          commands.push(parsed);
        }
      }
    }
  }

  // If no code blocks found, treat all non-empty lines as potential commands
  if (commands.length === 0) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = stripInlineComment(line);
      // Skip empty lines and markdown syntax
      if (
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('```') &&
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('`')
      ) {
        const parsed = parseCommand(trimmed);
        if (parsed.type !== 'unknown') {
          commands.push(parsed);
        }
      }
    }
  }

  return commands;
}

/**
 * Strip inline `//` comments from a line while preserving otherwise valid text.
 */
function stripInlineComment(line: string): string {
  const withoutComment = line.split('//')[0];
  return withoutComment.trim();
}
