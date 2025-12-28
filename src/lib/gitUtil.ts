import { Notice } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitUtil {
  constructor(private vaultPath: string) {}

  private async runGitCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execAsync(command, {
        cwd: this.vaultPath,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      return result;
    } catch (error: any) {
      throw new Error(`Git command failed: ${error.message}\nStderr: ${error.stderr}`);
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.runGitCommand('git rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  async hasRemote(): Promise<boolean> {
    try {
      const { stdout } = await this.runGitCommand('git remote');
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async getRemoteUrl(): Promise<string | null> {
    try {
      const { stdout } = await this.runGitCommand('git remote get-url origin');
      return stdout.trim();
    } catch {
      return null;
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    try {
      const { stdout } = await this.runGitCommand('git status --porcelain');
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async getBranchName(): Promise<string> {
    try {
      const { stdout } = await this.runGitCommand('git rev-parse --abbrev-ref HEAD');
      return stdout.trim();
    } catch {
      return 'main';
    }
  }

  async init(): Promise<void> {
    await this.runGitCommand('git init');
  }

  async add(pattern: string = '-A'): Promise<void> {
    await this.runGitCommand(`git add ${pattern}`);
  }

  async commit(message: string): Promise<void> {
    const escapedMessage = message.replace(/"/g, '\\"');
    await this.runGitCommand(`git commit -m "${escapedMessage}"`);
  }

  async push(): Promise<void> {
    await this.runGitCommand('git push');
  }

  async pushWithUpstream(branch: string = 'main'): Promise<void> {
    await this.runGitCommand(`git push -u origin ${branch}`);
  }

  async setRemote(url: string): Promise<void> {
    const hasRemote = await this.hasRemote();
    if (hasRemote) {
      await this.runGitCommand(`git remote set-url origin "${url}"`);
    } else {
      await this.runGitCommand(`git remote add origin "${url}"`);
    }
  }

  async syncAndPush(commitMessage?: string): Promise<void> {
    const isRepo = await this.isGitRepository();
    if (!isRepo) {
      throw new Error('Not a git repository. Please initialize git first.');
    }

    const hasRemote = await this.hasRemote();
    if (!hasRemote) {
      throw new Error('No git remote configured. Please add a remote first.');
    }

    // Stage all changes
    await this.add();

    // Check if there are changes to commit
    const hasChanges = await this.hasUncommittedChanges();
    if (hasChanges) {
      const message = commitMessage || `VaultSite publish: ${new Date().toISOString()}`;
      await this.commit(message);
      new Notice('Changes committed');
    } else {
      new Notice('No changes to commit');
    }

    // Push
    try {
      await this.push();
      new Notice('Pushed to GitHub successfully!');
    } catch (error: any) {
      // If push fails, might need to set upstream
      if (error.message.includes('upstream')) {
        const branch = await this.getBranchName();
        await this.pushWithUpstream(branch);
        new Notice('Pushed to GitHub successfully!');
      } else {
        throw error;
      }
    }
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
}
