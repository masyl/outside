import { DevsideInput } from "./packages/devside/prompt.ts";

async function main() {
  try {
    const res = await DevsideInput.prompt({
      message: "Test>",
      suggestions: ["hello", "world"],
      list: false,
      history: ["prev"]
    });
    console.log("Result:", res);
  } catch (e) {
    console.log("Error:", e);
  }
}
main();
