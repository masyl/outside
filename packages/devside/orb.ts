/**
 * Wraps OrbStack native CLI commands (orb).
 */

export interface OrbMachine {
  state: 'stopped' | 'ontrack' | 'offtrack' | string;
  name: string;
  branch: string;
  status: string;
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

  // Fetch branches from git worktree list
  const gitCommand = new Deno.Command('git', {
    args: ['worktree', 'list', '--porcelain'],
    stdout: 'piped',
  });
  const gitOutput = await gitCommand.output();
  const branchesText = new TextDecoder().decode(gitOutput.stdout);
  
  const trackBranches: Record<string, string> = {};
  let currentWorktreeName: string | null = null;

  for (const line of branchesText.split('\n')) {
    if (line.startsWith('worktree ')) {
      const wtPath = line.substring(9).trim();
      const match = wtPath.match(/\.tracks\/([^/]+)$/);
      if (match) {
        currentWorktreeName = match[1];
      } else {
        currentWorktreeName = null;
      }
    } else if (line.startsWith('branch refs/heads/') && currentWorktreeName) {
      trackBranches[currentWorktreeName] = line.substring(18).trim();
    }
  }

  return rawMachines.map((m) => {
    let state = 'stopped';
    let status = '';
    const activeBranch = trackBranches[m.name];
    const branch = activeBranch || '<none>';

    if (m.state === 'running') {
      if (!activeBranch) {
        state = 'offtrack';
        status = 'Missing worktree';
      } else {
        if (activeBranch === `track/${m.name}` || activeBranch.startsWith(`track/${m.name}/`)) {
          state = 'ontrack';
          status = 'OK';
        } else {
          state = 'offtrack';
          status = 'Invalid branch name';
        }
      }
    } else if (m.state === 'stopped') {
      state = 'stopped';
      status = 'Container is not running';
    } else {
      state = 'offtrack';
      status = `OrbStack state: ${m.state}`;
    }

    return {
      state,
      name: m.name,
      branch,
      status,
    };
  });
}
