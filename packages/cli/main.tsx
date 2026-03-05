import React from "react";
import { withFullScreen } from "fullscreen-ink";
import { Repl } from "./src/repl/Repl.tsx";
import pkg from "./deno.json" with { type: "json" };

withFullScreen(<Repl version={pkg.version} />).start();
// test hook
// test hook again
