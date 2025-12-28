import { App, TFile, Notice } from 'obsidian';
import { PublishConfig } from './config';
import { FileSystemUtil } from './fsUtil';
import { LinkRewriter } from './linkRewrite';
import * as path from 'path';

export class SyncEngine {
  private fsUtil: FileSystemUtil;

  constructor(
    private app: App,
    private config: PublishConfig
  ) {
    this.fsUtil = new FileSystemUtil(app);
  }

  async syncNotes(): Promise<{ synced: number; skipped: number }> {
    const notice = new Notice('Syncing notes...', 0);

    try {
      // Get all markdown files
      const markdownFiles = this.app.vault.getMarkdownFiles();
      console.log('VaultSite: Total markdown files:', markdownFiles.length);
      console.log('VaultSite: Files:', markdownFiles.map(f => f.path));
      console.log('VaultSite: Config:', this.config);

      // Filter files based on include/exclude
      const filesToSync = markdownFiles.filter(file => {
        const shouldSync = this.shouldSyncFile(file.path);
        console.log(`VaultSite: ${file.path} -> ${shouldSync ? 'SYNC' : 'SKIP'}`);
        return shouldSync;
      });

      if (filesToSync.length === 0) {
        notice.hide();
        new Notice('No notes to sync. Check your include/exclude settings.');
        console.error('VaultSite: No files matched include/exclude filters');
        return { synced: 0, skipped: markdownFiles.length };
      }

      // Clear content directory
      await this.clearContentDirectory();

      // Build note index for link rewriting
      const allNotePaths = filesToSync.map(f => f.path);
      const linkRewriter = new LinkRewriter(this.config, allNotePaths);

      // Copy and process files
      let syncedCount = 0;
      for (const file of filesToSync) {
        await this.syncFile(file, linkRewriter);
        syncedCount++;
      }

      notice.hide();
      new Notice(`✓ Synced ${syncedCount} notes to ${this.config.contentDir}`);

      return { synced: syncedCount, skipped: markdownFiles.length - syncedCount };
    } catch (error: any) {
      notice.hide();
      console.error('Sync error:', error);
      new Notice(`Sync failed: ${error.message}`);
      throw error;
    }
  }

  private shouldSyncFile(filePath: string): boolean {
    // Check excludes first
    const isExcluded = this.fsUtil.isPathExcluded(filePath, this.config.exclude);
    if (isExcluded) {
      console.log(`VaultSite: ${filePath} excluded`);
      return false;
    }

    // Check includes
    if (this.config.include.length > 0) {
      const isIncluded = this.fsUtil.isPathIncluded(filePath, this.config.include);
      console.log(`VaultSite: ${filePath} include check: ${isIncluded}`);
      return isIncluded;
    }

    return true;
  }

  private async clearContentDirectory(): Promise<void> {
    const contentDirExists = await this.fsUtil.fileExists(this.config.contentDir);
    if (contentDirExists) {
      // Delete and recreate
      await this.fsUtil.deleteDirectory(this.config.contentDir);
    }
    await this.fsUtil.ensureDirectory(this.config.contentDir);
  }

  private async syncFile(file: TFile, linkRewriter: LinkRewriter): Promise<void> {
    // Read file content
    const content = await this.app.vault.read(file);

    // Rewrite wikilinks
    const rewrittenContent = linkRewriter.rewriteLinks(content);

    // Determine destination path
    const destPath = path.join(this.config.contentDir, file.path);

    // Write file
    await this.fsUtil.writeFile(destPath, rewrittenContent);
  }

  async copyAssets(): Promise<void> {
    // TODO: Implement asset copying for images
    // For MVP, this is optional
    new Notice('Asset copying not yet implemented');
  }
}
