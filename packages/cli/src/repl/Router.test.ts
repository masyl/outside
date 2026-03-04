import { ContextRouter } from "./Router.ts";
import { assertEquals } from "jsr:@std/assert@1";

Deno.test("ContextRouter - Standard Route Registration and Navigation", () => {
  const router = new ContextRouter();
  
  // Initially at root
  assertEquals(router.getCurrentPath(), "/");
  
  // Can cd into simple path
  const ok1 = router.cd("track");
  assertEquals(ok1, true);
  assertEquals(router.getCurrentPath(), "/track");
  
  // Can cd into nested variable path
  const ok2 = router.cd("doc");
  assertEquals(ok2, true);
  assertEquals(router.getCurrentPath(), "/track/doc");

  // Can cd relative upwards
  const ok3 = router.cd("..");
  assertEquals(ok3, true);
  assertEquals(router.getCurrentPath(), "/track");
  
  // Cannot cd into root-level unknown path
  const ok4 = router.cd("/unknown-magic-string");
  assertEquals(ok4, false);
  assertEquals(router.getCurrentPath(), "/track"); // Remains unchanged
});

Deno.test("ContextRouter - Command Translation at Root", () => {
    const router = new ContextRouter();
    
    const translate1 = router.translate("help");
    assertEquals(translate1?.command, "help");
    assertEquals(translate1?.args, []);

    const translate2 = router.translate("track list --json");
    assertEquals(translate2?.command, "track");
    assertEquals(translate2?.args, ["list", "--json"]);
});

Deno.test("ContextRouter - Command Translation in Context", () => {
    const router = new ContextRouter();
    router.cd("track");
    assertEquals(router.getCurrentPath(), "/track");

    const translate1 = router.translate("list");
    assertEquals(translate1?.command, "track");
    assertEquals(translate1?.args, ["list"]);

    router.cd("foo");
    assertEquals(router.getCurrentPath(), "/track/foo");

    const translate2 = router.translate("destroy");
    assertEquals(translate2?.command, "track");
    assertEquals(translate2?.args, ["destroy", "foo"]);

    const translate3 = router.translate("fix worktree");
    assertEquals(translate3?.command, "track-fix-worktree");
    assertEquals(translate3?.args, ["foo"]);
});

Deno.test("ContextRouter - Handle empty input cleanly", () => {
    const router = new ContextRouter();
    const result = router.translate("");
    assertEquals(result, null);
    
    const result2 = router.translate("   \t  ");
    assertEquals(result2, null);
});
