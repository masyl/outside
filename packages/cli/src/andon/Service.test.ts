import { AndonService } from "./Service.ts";
import { assertEquals } from "jsr:@std/assert@1";

Deno.test("AndonService - state transitions and expiration", async () => {
    // Use values large enough to allow `orb list` subprocess to resolve cleanly (typically 50-200ms) 
    // without piling up and leaking Deno process handles when the test forces an exit.
    const service = new AndonService(1000, 1500);
    
    let lastState = "stopped";
    const unsub = service.subscribe((data, state) => {
        lastState = state;
    });

    // Subscribing immediately emits the current State
    assertEquals(lastState, "stopped");

    // Request refresh extends expiration and goes to polling
    service.requestRefresh();
    
    // We expect state to be polling immediately
    assertEquals(lastState, "polling");

    // Wait for the requested refresh expiration (1500ms + small buffer)
    await new Promise(r => setTimeout(r, 1600));
    
    // Once expired, it should automatically shift to idle to save resources
    assertEquals(lastState, "idle");

    unsub();
    service.stop();
});
