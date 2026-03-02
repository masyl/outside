/**
 * Wraps OrbStack native CLI commands (orb).
 */

export interface OrbMachine {
  state: 'running' | 'stopped' | 'creating' | string;
  name: string;
  branch: string;
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
  const rawMachines = JSON.parse(text) as any[];

  // Fetch branches to see if any match the track name
  const gitCommand = new Deno.Command('git', {
    args: ['branch', '--list', 'track/*'],
    stdout: 'piped',
  });
  const gitOutput = await gitCommand.output();
  const branchesText = new TextDecoder().decode(gitOutput.stdout);
  
  // Extract just the track names from the `track/*` branch listing
  // Example output: "  track/devops\n* track/simulator"
  const activeBranches = branchesText
    .split('\n')
    .map(line => line.replace(/^[*\s]+track\//, '').trim())
    .filter(name => !!name);

  return rawMachines.map((m) => {
    return {
      state: m.state,
      name: m.name,
      branch: activeBranches.includes(m.name) ? `track/${m.name}` : '<none>',
    };
  });
}
