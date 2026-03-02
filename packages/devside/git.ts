import { ensureDir } from 'https://deno.land/std@0.224.0/fs/ensure_dir.ts';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { Select } from '@cliffy/prompt';

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
    console.log(`Worktree ${worktreePath} already exists.`);
    return true;
  }

  const args = ['worktree', 'add'];
  
  if (!hasBranch) {
    // Branch does not exist, create it from current HEAD (or whatever default)
    console.log(`Branch ${branchName} does not exist. Creating it...`);
    args.push('-b', branchName);
  } else {
    console.log(`Branch ${branchName} already exists. Checking it out in worktree...`);
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

async function selectTargetBranch(trackName: string, message: string): Promise<string> {
  const branches = await getTrackBranches(trackName);
  let targetBranch = `track/${trackName}`;

  if (branches.length === 0) {
    // No branches exist, we'll return the base to be created
    return targetBranch;
  } else if (branches.includes(targetBranch)) {
    // Root branch exists, naturally prefer it
    return targetBranch;
  } else if (branches.length === 1) {
    // Only one sub-branch exists, default to it
    return branches[0];
  } else {
    // Multiple exist, no root. Prompt user.
    return await Select.prompt({
      message,
      options: branches,
    });
  }
}

export async function fixWorktree(trackName: string): Promise<boolean> {
  const worktreePath = `.tracks/${trackName}`;
  const hasWorktree = await worktreeExists(worktreePath);
  if (hasWorktree) {
    console.log(`Worktree ${worktreePath} already exists and is valid.`);
    return true;
  }

  const branches = await getTrackBranches(trackName);
  const targetBranch = await selectTargetBranch(trackName, 'Multiple matching track branches found. Select one for the new worktree:');

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
    console.log(`Successfully fixed worktree for track '${trackName}' at ${worktreePath} -> branch ${targetBranch}`);
  }
  return code === 0;
}

export async function fixBranch(trackName: string): Promise<boolean> {
  const worktreePath = `.tracks/${trackName}`;
  const hasWorktree = await worktreeExists(worktreePath);
  if (!hasWorktree) {
    console.error(`Worktree ${worktreePath} does not exist. Please run 'fix worktree' first.`);
    return false;
  }

  const branches = await getTrackBranches(trackName);
  const targetBranch = await selectTargetBranch(trackName, 'Multiple matching track branches found. Select one to checkout:');

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
    console.log(`Successfully fixed branch for track '${trackName}' in worktree -> ${targetBranch}`);
  }
  return code === 0;
}
