import { CommandHistory } from "./History.ts";
import { assertEquals } from "jsr:@std/assert@1";
import { join } from "jsr:@std/path@1";

Deno.test("CommandHistory - Push and cycle commands", async () => {
  const history = new CommandHistory();
  // Override history file to a temp file so we don't mess with real history
  const tempFile = await Deno.makeTempFile();
  // We use object extension dynamically for the test since property is private
  (history as any).historyFile = tempFile;

  await history.push("track list");
  await history.push("track create banana");

  // Previous moves pointer back
  assertEquals(history.getPreviousCommand(), "track create banana");
  assertEquals(history.getPreviousCommand(), "track list");
  // Cannot go back further
  assertEquals(history.getPreviousCommand(), null);

  // Next moves pointer forward
  assertEquals(history.getNextCommand(), "track create banana");
  
  // Going past the end returns empty string (blank prompt)
  assertEquals(history.getNextCommand(), "");
  
  // Can't go further
  assertEquals(history.getNextCommand(), null);

  // Test deduplication
  await history.push("track status");
  await history.push("track status");
  
  // Should only have pushed once
  assertEquals((history as any).memory.length, 3);

  // Load from disk
  const newHistory = new CommandHistory();
  (newHistory as any).historyFile = tempFile;
  await newHistory.load();

  assertEquals((newHistory as any).memory.length, 3);
  assertEquals((newHistory as any).memory[0], "track list");
  assertEquals((newHistory as any).memory[1], "track create banana");
  assertEquals((newHistory as any).memory[2], "track status");

  await Deno.remove(tempFile);
});
