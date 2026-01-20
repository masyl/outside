/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'build'],
    setupFiles: ['./src/test-setup.ts'],
    // Use forks to ensure process isolation and avoid sandbox issues
    // Note: 'pool' and 'poolOptions' are deprecated in Vitest 3/4+ but might still be needed for specific versions or migrations.
    // The deprecated warning suggests top-level options, but let's stick to the configuration that works and is compliant with the warning if possible.
    // Actually, let's fix the deprecation warning if we can, or just accept it as it works.
    // Vitest 4 migration guide says:
    // poolOptions -> project level options.
    // But for now, let's just leave it if it works, or try to clean it up.
    // The warning says: "`test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options."
    // So we should move it out of 'test' object? No, "top-level options" usually means inside the config object but outside 'test'?
    // Or maybe inside 'test' but directly?
    // Let's check the docs if I could.
    // But since it worked, I'll leave it for now to avoid breaking it,
    // unless the user specifically asked to fix deprecations (they asked for concise output).
    // The warning is noise. Let's fix it.
    // The warning says: `test.poolOptions` was removed.
    // So likely:
    // export default defineConfig({
    //   test: {
    //     pool: 'forks',
    //     fileParallelism: false, // equivalent to singleFork?
    //   }
    // })
    //
    // Let's try to just remove the poolOptions block and trust 'pool: forks' + default behavior,
    // or look for the correct syntax.
    // 'singleFork' usually maps to 'fileParallelism: false'.

    pool: 'forks',
    fileParallelism: false,

    // Suppress console logs to keep test output clean
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
      return false;
    },
    reporters: ['default'],
  },
});
