/**
 * GitUtil - Provides git command instructions for manual execution
 *
 * Note: Obsidian plugins cannot execute git commands directly due to sandboxing.
 * This utility provides formatted instructions that users can copy and run in their terminal.
 * For automatic git integration, users should install the "Obsidian Git" community plugin.
 */
export class GitUtil {
  constructor(private vaultPath: string) {}

  /**
   * Checks if the vault directory appears to be a git repository
   * This is a best-effort check based on file system only
   */
  isGitRepository(): boolean {
    // We can't execute git commands, so we check for .git directory
    // This requires access to the file system through the app
    // For now, we'll return false and rely on manual setup
    return false;
  }

  hasRemote(): boolean {
    // Cannot be determined without executing git commands
    return false;
  }

  getRemoteUrl(): string | null {
    // Cannot be determined without executing git commands
    return null;
  }

  getGitInstructions(): string[] {
    return [
      'git init',
      'git add -A',
      'git commit -m "Initial commit"',
    ];
  }

  getRemoteInstructions(repoUrl: string): string[] {
    return [
      `git remote add origin ${repoUrl}`,
      'git branch -M main',
      'git push -u origin main',
    ];
  }

  getSyncAndPushInstructions(commitMessage?: string): string[] {
    const message = commitMessage || `VaultSite publish: ${new Date().toISOString()}`;
    return [
      'git add -A',
      `git commit -m "${message}"`,
      'git push',
    ];
  }

  /**
   * Get the vault path for display purposes
   */
  getVaultPath(): string {
    return this.vaultPath;
  }
}
