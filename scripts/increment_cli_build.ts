#!/usr/bin/env deno run --allow-read --allow-write --allow-env --allow-run
import { join } from "jsr:@std/path@1";

const projectRoot = Deno.cwd();
const denoJsonPath = join(projectRoot, "packages/cli/deno.json");

async function incrementBuild() {
  try {
    const content = await Deno.readTextFile(denoJsonPath);
    const config = JSON.parse(content);
    
    // version format: 0.1.0+build
    let [version, buildStr] = config.version.split("+");
    let build = parseInt(buildStr || "0", 10);
    build++;
    
    config.version = `${version}+${build}`;
    
    await Deno.writeTextFile(denoJsonPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`CLI version incremented to ${config.version}`);
    
    // Stage the updated deno.json
    const command = new Deno.Command("git", {
      args: ["add", "packages/cli/deno.json"],
    });
    await command.output();
  } catch (err) {
    console.error("Failed to increment build number:", err.message);
    Deno.exit(1);
  }
}

await incrementBuild();
