import { ensureDir } from 'jsr:@std/fs@1';
import { $ } from "npm:execa@8";
import { resolve, join } from "jsr:@std/path@1";
import { emitProgress } from '../commands/Command.ts';

/**
 * Checks if a specific branch exists locally.
 */
export async function branchExists(branchName: string): Promise<boolean> {
  const command = new Deno.Command('git', {
    args: ['branch', '--list', branchName],
    stdout: 'piped',
  });
  const { code, stdout } = await command.output();
  if (code !== 0) return false;
  
  const output = new TextDecoder().decode(stdout).trim();
  // `git branch --list` returns empty string if not found, or "  branchName" / "* branchName" if found
  return output.length > 0;
}

/**
 * Checks if a directory exists and is a valid git worktree.
 */
export async function worktreeExists(path: string): Promise<boolean> {
  const command = new Deno.Command('git', {
    args: ['worktree', 'list', '--porcelain'],
    stdout: 'piped',
  });
  const { code, stdout } = await command.output();
  if (code !== 0) return false;

  const output = new TextDecoder().decode(stdout);
  // `git worktree list --porcelain` has lines starting with `worktree /absolute/path`
  // We can just check if any worktree line ends with our relative or absolute path.
  // It's safer to just look for the path string in the output.
  const absolutePath = await Deno.realPath('.').catch(() => Deno.cwd());
  const targetPath = join(absolutePath, path);
  
  return output.includes(`worktree ${targetPath}`);
}

/**
 * Creates a git worktree for a track, creating the branch if necessary.
 */
export async function createTrackWorktree(trackName: string): Promise<boolean> {
  const branchName = `track/${trackName}`;
  const worktreePath = `.tracks/${trackName}`;

  // Ensure .tracks directory exists
  try {
    await Deno.mkdir('.tracks', { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      console.error(`Failed to create .tracks directory: ${err}`);
      return false;
    }
  }

  const hasBranch = await branchExists(branchName);
  const hasWorktree = await worktreeExists(worktreePath);

  if (hasWorktree) {
    emitProgress("worktree", 100, `Worktree ${worktreePath} already exists.`);
    return true;
  }

  const args = ['worktree', 'add'];
  
  if (!hasBranch) {
    emitProgress("worktree", 20, `Branch ${branchName} does not exist. Creating it...`);
    args.push('-b', branchName);
  } else {
    emitProgress("worktree", 20, `Branch ${branchName} already exists. Checking it out in worktree...`);
  }
  
  args.push(worktreePath);
  
  if (hasBranch) {
    args.push(branchName);
  }

  const command = new Deno.Command('git', {
    args,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  
  const { code } = await command.output();
  return code === 0;
}

export async function getTrackBranches(trackName: string): Promise<string[]> {
  const command = new Deno.Command('git', {
    args: ['branch', '--list', `track/${trackName}*`, '--format=%(refname:short)'],
    stdout: 'piped',
  });
  const { code, stdout } = await command.output();
  if (code !== 0) return [];
  const text = new TextDecoder().decode(stdout).trim();
  if (!text) return [];
  return text.split('\n').map(b => b.trim());
}

export async function selectTargetBranch(trackName: string, targetBranchOverride?: string): Promise<string> {
  const branches = await getTrackBranches(trackName);
  let defaultBranch = `track/${trackName}`;

  if (targetBranchOverride) {
      if (!branches.includes(targetBranchOverride)) {
          throw new Error(`Specified branch '${targetBranchOverride}' does not exist for track '${trackName}'`);
      }
      return targetBranchOverride;
  }

  if (branches.length === 0) {
    // No branches exist, we'll return the base to be created
    return defaultBranch;
  } else if (branches.includes(defaultBranch)) {
    // Root branch exists, naturally prefer it
    return defaultBranch;
  } else if (branches.length === 1) {
    // Only one sub-branch exists, default to it
    return branches[0];
  } else {
    // Multiple exist, no root. Throw error.
    throw new Error(`Multiple matching track branches found. Please specify target branch. Available: ${branches.join(", ")}`);
  }
}

export async function fixWorktree(trackName: string, targetBranchOverride?: string): Promise<boolean> {
  const worktreePath = `.tracks/${trackName}`;
  const hasWorktree = await worktreeExists(worktreePath);
  if (hasWorktree) {
    emitProgress("worktree", 100, `Worktree ${worktreePath} already exists and is valid.`);
    return true;
  }

  const branches = await getTrackBranches(trackName);
  const targetBranch = await selectTargetBranch(trackName, targetBranchOverride);

  const args = ['worktree', 'add'];
  if (branches.length === 0) {
    args.push('-b', targetBranch);
  }
  args.push(worktreePath, targetBranch);

  const cmd = new Deno.Command('git', {
    args,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await cmd.output();
  if (code === 0) {
    emitProgress("worktree", 100, `Successfully fixed worktree for track '${trackName}' at ${worktreePath} -> branch ${targetBranch}`);
  }
  return code === 0;
}

export async function fixBranch(trackName: string, targetBranchOverride?: string): Promise<boolean> {
  const worktreePath = `.tracks/${trackName}`;
  const hasWorktree = await worktreeExists(worktreePath);
  if (!hasWorktree) {
    throw new Error(`Worktree ${worktreePath} does not exist. Please run 'fix worktree' first.`);
  }

  const branches = await getTrackBranches(trackName);
  const targetBranch = await selectTargetBranch(trackName, targetBranchOverride);

  const args = ['-C', worktreePath, 'checkout'];
  if (branches.length === 0) {
    args.push('-b', targetBranch);
  } else {
    args.push(targetBranch);
  }

  const cmd = new Deno.Command('git', {
    args,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await cmd.output();
  if (code === 0) {
    emitProgress("branch", 100, `Successfully fixed branch for track '${trackName}' in worktree -> ${targetBranch}`);
  }
  return code === 0;
}
