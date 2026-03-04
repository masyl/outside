import { AndonService } from "./Service.ts";
import { assertEquals } from "jsr:@std/assert@1";

Deno.test("AndonService - state transitions and expiration", async () => {
    // Fast intervals for test: 10ms poll, 50ms expire
    const service = new AndonService(10, 50);
    
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

    // Wait for the requested refresh expiration (50ms + small buffer)
    await new Promise(r => setTimeout(r, 80));
    
    // Once expired, it should automatically shift to idle to save resources
    assertEquals(lastState, "idle");

    unsub();
});
