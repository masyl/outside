import { ContextRouter } from "./Router.ts";
import { assertEquals } from "jsr:@std/assert@1";

Deno.test("ContextRouter - Standard Route Registration and Navigation", () => {
  const router = new ContextRouter();
  
  // Initially at root
  assertEquals(router.getCurrentPath(), "/");
  
  // Can cd into simple path
  const ok1 = router.cd("dev");
  assertEquals(ok1, true);
  assertEquals(router.getCurrentPath(), "/dev");
  
  // Can cd into nested variable path
  const ok2 = router.cd("tracks/doc");
  assertEquals(ok2, true);
  assertEquals(router.getCurrentPath(), "/dev/tracks/doc");

  // Can cd relative upwards
  const ok3 = router.cd("..");
  assertEquals(ok3, true);
  assertEquals(router.getCurrentPath(), "/dev/tracks");
  
  // Cannot cd into root-level unknown path
  const ok4 = router.cd("/unknown-magic-string");
  assertEquals(ok4, false);
  assertEquals(router.getCurrentPath(), "/dev/tracks"); // Remains unchanged
});

Deno.test("ContextRouter - Command Translation at Root", () => {
    const router = new ContextRouter();
    
    const translate1 = router.translate("help");
    assertEquals(translate1?.command, "help");
    assertEquals(translate1?.args, []);

    const translate2 = router.translate("dev");
    assertEquals(translate2?.command, "cd");
    assertEquals(translate2?.args, ["dev"]);
});

Deno.test("ContextRouter - Command Translation in Context", () => {
    const router = new ContextRouter();
    router.cd("dev");
    router.cd("tracks");
    assertEquals(router.getCurrentPath(), "/dev/tracks");

    const translate1 = router.translate("list");
    assertEquals(translate1?.command, "track");
    assertEquals(translate1?.args, ["list"]);

    router.cd("foo");
    assertEquals(router.getCurrentPath(), "/dev/tracks/foo");

    const translate2 = router.translate("destroy");
    assertEquals(translate2?.command, "track");
    assertEquals(translate2?.args, ["destroy", "foo"]);

    // Fix translation works via intermediate context cd followed by running scripts or just translates natively in the new path
    const translate3 = router.translate("fix");
    assertEquals(translate3?.command, "cd");
    assertEquals(translate3?.args, ["/dev/tracks/foo/fix"]);

    router.cd("fix");
    const translate4 = router.translate("worktree");
    assertEquals(translate4?.command, "track-fix-worktree");
    assertEquals(translate4?.args, ["foo"]);
});

Deno.test("ContextRouter - Handle empty input cleanly", () => {
    const router = new ContextRouter();
    const result = router.translate("");
    assertEquals(result, null);
    
    const result2 = router.translate("   \t  ");
    assertEquals(result2, null);
});
