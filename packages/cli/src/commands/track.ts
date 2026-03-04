import { Command } from "jsr:@cliffy/command@^1.0.0";
import { listCommand } from "./track/list.ts";
import { createCommand } from "./track/create.ts";
import { destroyCommand } from "./track/destroy.ts";

const trackCommand = new Command()
  .name("track")
  .description("Manage Outside development tracks")
  .command("list", listCommand)
  .command("create", createCommand)
  .command("destroy", destroyCommand);

if (import.meta.main) {
  await trackCommand.parse(Deno.args);
}
