import { spawn } from 'node:child_process';

const child = spawn('vitepress', ['build', 'docs'], {
  env: process.env,
  shell: process.platform === 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});

let combinedOutput = '';

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stderr.write(text);
});

child.on('error', (error) => {
  console.error('[outside-design] Failed to start VitePress build:', error);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    process.exit(0);
  }

  const isDeadLinkFailure = /\[vitepress\]\s+\d+\s+dead link\(s\) found\./i.test(combinedOutput);

  if (isDeadLinkFailure) {
    console.warn(
      '\n[outside-design] Dead links were found. Treating this as a warning; build continues.'
    );
    process.exit(0);
  }

  process.exit(code ?? 1);
});
