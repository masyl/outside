/**
 * Wraps OrbStack native CLI commands (orb).
 */

export interface OrbMachine {
  name: string;
  state: 'running' | 'stopped' | 'creating' | string;
  ip?: string;
}

export async function createMachine(name: string): Promise<boolean> {
  const command = new Deno.Command('orb', {
    args: ['create', 'ubuntu', name],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await command.output();
  return code === 0;
}

export async function destroyMachine(name: string): Promise<boolean> {
  const command = new Deno.Command('orb', {
    args: ['delete', name],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await command.output();
  return code === 0;
}

export async function listMachines(): Promise<OrbMachine[]> {
  const command = new Deno.Command('orb', {
    args: ['list', '--format', 'json'],
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout } = await command.output();
  if (code !== 0) {
    throw new Error('Failed to list machines. Is OrbStack running?');
  }
  const text = new TextDecoder().decode(stdout);
  return JSON.parse(text) as OrbMachine[];
}
