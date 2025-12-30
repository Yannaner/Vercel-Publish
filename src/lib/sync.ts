import { App, TFile, Notice, normalizePath } from 'obsidian';
import { PublishConfig } from './config';
import { FileSystemUtil } from './fsUtil';
import { LinkRewriter } from './linkRewrite';

export class SyncEngine {
  private fsUtil: FileSystemUtil;

  constructor(
    private app: App,
    private config: PublishConfig
  ) {
    this.fsUtil = new FileSystemUtil(app);
  }

  private join(...parts: string[]): string {
    return normalizePath(parts.join('/'));
  }

  async syncNotes(): Promise<{ synced: number; skipped: number }> {
    const notice = new Notice('Syncing notes...', 0);

    try {
      // Get all markdown files
      const markdownFiles = this.app.vault.getMarkdownFiles();
      console.debug('Vercel Publish: Total markdown files:', markdownFiles.length);
      console.debug('Vercel Publish: Files:', markdownFiles.map(f => f.path));
      console.debug('Vercel Publish: Config:', this.config);

      // Filter files based on include/exclude
      const filesToSync = markdownFiles.filter(file => {
        const shouldSync = this.shouldSyncFile(file.path);
        console.debug(`Vercel Publish: ${file.path} -> ${shouldSync ? 'SYNC' : 'SKIP'}`);
        return shouldSync;
      });

      if (filesToSync.length === 0) {
        notice.hide();
        new Notice('No notes found to sync.');
        new Notice('Notes outside the site folder will be synced. Check your exclude settings in publish.config.json if needed.');
        console.error('Vercel Publish: No files matched include/exclude filters');
        return { synced: 0, skipped: markdownFiles.length };
      }

      // Show what will be synced
      const outsideSiteFiles = filesToSync.filter(f => !f.path.startsWith('site/'));
      if (outsideSiteFiles.length > 0) {
        console.debug(`Vercel Publish: Found ${outsideSiteFiles.length} notes outside site folder:`, outsideSiteFiles.map(f => f.path));
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
    } catch (error: unknown) {
      notice.hide();
      console.error('Sync error:', error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Sync failed: ${message}`);
      throw error;
    }
  }

  private shouldSyncFile(filePath: string): boolean {
    // Check excludes first
    const isExcluded = this.fsUtil.isPathExcluded(filePath, this.config.exclude);
    if (isExcluded) {
      console.debug(`Vercel Publish: ${filePath} excluded`);
      return false;
    }

    // Check includes
    if (this.config.include.length > 0) {
      const isIncluded = this.fsUtil.isPathIncluded(filePath, this.config.include);
      console.debug(`Vercel Publish: ${filePath} include check: ${isIncluded}`);
      return isIncluded;
    }

    // If no includes specified, include all (that aren't excluded)
    console.debug(`Vercel Publish: ${filePath} included (no include filter)`);
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
    const destPath = this.join(this.config.contentDir, file.path);

    // Write file
    await this.fsUtil.writeFile(destPath, rewrittenContent);
  }
}
