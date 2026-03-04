import { ContextRouter } from "./src/repl/Router.ts";
const router = new ContextRouter();
console.log("cd track:", router.cd("track"));
console.log("cd devops from /track:", router.cd("devops"));
