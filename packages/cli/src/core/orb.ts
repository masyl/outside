/**
 * Wraps OrbStack native CLI commands (orb).
 */
import { emitProgress } from '../commands/Command.ts';

export type AndonColor = 'red' | 'green' | 'yellow' | 'blue';

export const ANDON_COLORS = {
  red: { label: 'Critical', bg: 'bgRed', fg: 'white', description: 'Critical problem, line stopped, requires immediate attention.' },
  green: { label: 'Normal', bg: 'bgGreen', fg: 'white', description: 'Normal operation, everything running smoothly.' },
  yellow: { label: 'Warning', bg: 'bgYellow', fg: 'black', description: 'Warning, operator needs assistance, or minor defect identified.' },
  blue: { label: 'Maintenance', bg: 'bgBlue', fg: 'white', description: 'Planned stoppage, maintenance, loading, setting up, etc.' },
} as const;

export const ANDON_COMPONENTS = {
  tr: { label: 'Track', symbol: 'Tr', description: 'OrbStack Machine State' },
  co: { label: 'Container', symbol: 'Co', description: 'Docker Proxy Container' },
  br: { label: 'Branch', symbol: 'Br', description: 'Active Git Branch' },
  wt: { label: 'Worktree', symbol: 'Wt', description: 'Git Worktree Presence' },
} as const;

export interface AndonStatus {
  tr: AndonColor;
  co: AndonColor;
  br: AndonColor;
  wt: AndonColor;
}

export interface OrbMachine {
  state: 'stopped' | 'ontrack' | 'offtrack' | string;
  name: string;
  branch: string;
  status: string;
  andon: AndonStatus;
}

export async function createMachine(name: string): Promise<boolean> {
  // Check if it already exists
  const existing = await listMachines();
  if (existing.some((m) => m.name === name)) {
    emitProgress("orb", 100, `OrbStack machine '${name}' already exists.`);
    return true;
  }

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

  // Fetch Docker containers via orbstack context
  const dockerCommand = new Deno.Command('docker', {
    args: ['--context', 'orbstack', 'ps', '-a', '--format', 'json'],
    stdout: 'piped',
  });
  const dockerOutput = await dockerCommand.output();
  const dockerText = new TextDecoder().decode(dockerOutput.stdout);
  const proxyContainers = new Map<string, string>(); // name -> state
  for (const line of dockerText.trim().split('\n')) {
    if (!line) continue;
    try {
      const container = JSON.parse(line);
      const name = container.Names;
      if (name.startsWith('outside-proxy-')) {
        const trackName = name.replace('outside-proxy-', '');
        proxyContainers.set(trackName, container.State);
      }
    } catch (_e) {
      // Ignore parse errors on bad lines
    }
  }

  return rawMachines.map((m) => {
    let state = 'stopped';
    let status = '';
    const activeBranch = trackBranches[m.name];
    const branch = activeBranch || '<none>';
    const hasWorktree = !!activeBranch || branchesText.includes(`.tracks/${m.name}`);
    const containerState = proxyContainers.get(m.name);

    // Andon component: Tr (Track / Machine)
    let trColor: AndonColor = 'yellow';
    if (m.state === 'running') trColor = 'green';
    else if (m.state === 'stopped') trColor = 'blue';

    // Andon component: Co (Proxy Container)
    let coColor: AndonColor = 'yellow';
    if (containerState === 'running') {
      coColor = 'green';
    } else {
      coColor = m.state === 'running' ? 'red' : 'blue';
    }

    // Andon component: Br (Branch)
    let brColor: AndonColor = 'yellow';
    if (activeBranch) {
      if (activeBranch === `track/${m.name}` || activeBranch.startsWith(`track/${m.name}/`)) {
        brColor = 'green';
      }
    } else {
      brColor = m.state === 'running' ? 'red' : 'blue';
    }

    // Andon component: Wt (Worktree)
    let wtColor: AndonColor = 'yellow';
    if (hasWorktree) {
      wtColor = 'green';
    } else {
      wtColor = m.state === 'running' ? 'red' : 'blue';
    }

    // Meta State & Status Message
    if (m.state === 'running') {
      if (!hasWorktree) {
        state = 'offtrack';
        status = 'Missing worktree';
      } else if (containerState !== 'running') {
        state = 'offtrack';
        status = 'Proxy container down';
      } else if (brColor !== 'green') {
        state = 'offtrack';
        status = 'Invalid branch name';
      } else {
        state = 'ontrack';
        status = 'OK';
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
      andon: {
        tr: trColor,
        co: coColor,
        br: brColor,
        wt: wtColor,
      }
    };
  });
}
