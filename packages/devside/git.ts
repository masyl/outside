import { ensureDir } from 'https://deno.land/std@0.224.0/fs/ensure_dir.ts';
import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

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
