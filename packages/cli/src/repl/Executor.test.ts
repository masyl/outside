import { executeCommand, ExecutionEvent } from "./Executor.ts";
import { CommandExecution } from "./Router.ts";
import { assertEquals } from "jsr:@std/assert@1";

Deno.test("Executor - Subprocess spawning tracking output", async () => {
    // This integration test will actually spin up deno to run a tiny sub script
    const tempTestScript = await Deno.makeTempFile({ suffix: ".ts" });
    await Deno.writeTextFile(tempTestScript, `
      console.log(JSON.stringify({ type: "progress", phase: "init", progress: 10, message: "starting" }));
      console.log("Hello World");
      console.error("Some warning");
    `);

    // Mock the Executor mapping behavior by overriding the Deno path or arguments inside the test,
    // Since Executor hardcodes src/commands/ ..., we will actually just test against an existing command 
    // or we bypass the executeCommand wrapper and just test the streaming parser logic.
    // Let's test track-list --json actually executing our real track list command!

    const execPlan: CommandExecution = {
        command: "track-list", // "track list" translates to src/commands/track/list.ts
        args: [],
        options: {}
    };

    const events: ExecutionEvent[] = [];
    await executeCommand(execPlan, (ev: ExecutionEvent) => {
        events.push(ev);
    });

    // We expect the script to execute successfully and emit done
    const doneEvent = events.find(e => e.type === "done");
    assertEquals(doneEvent?.type, "done");
    assertEquals(doneEvent?.code, 0);

    // Track list outputs JSON
    const stdoutEvent = events.find(e => e.type === "stdout" && e.message?.includes("tracks"));
    // Might be null if the mocked machine array is empty? 
    // Wait, the structure always returns { tracks: [...] }, so it will have the text "tracks"
    assertEquals(stdoutEvent !== undefined, true, "Did not emit JSON tracks stdout");

    await Deno.remove(tempTestScript);
});
