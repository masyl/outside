import { Input } from "jsr:@cliffy/prompt@^1.0.0";
console.log(Object.keys(new (Input as any)({ message: "test", history: ["a"] }).settings));
