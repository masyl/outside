import { ContextRouter } from "./src/repl/Router.ts";
const router = new ContextRouter();

const tests = [
  { action: () => router.cd("dev"), expectedPath: "/dev" },
  { action: () => router.cd("tracks"), expectedPath: "/dev/tracks" },
  { action: () => router.cd("devops"), expectedPath: "/dev/tracks/devops" },
  { action: () => router.cd("fix"), expectedPath: "/dev/tracks/devops/fix" },
  { action: () => router.cd(".."), expectedPath: "/dev/tracks/devops" },
  { action: () => router.cd("/"), expectedPath: "/" },
  { action: () => router.translate("dev"), isTranslation: true },
  { action: () => router.cd("dev/tracks/foo/fix"), expectedPath: "/dev/tracks/foo/fix" },
];

for (const t of tests) {
  if (t.isTranslation) {
     console.log("Translation target:", t.action());
  } else {
     const res = t.action();
     console.log("cd result:", res, " | path:", router.getCurrentPath(), " | expected:", t.expectedPath);
  }
}
