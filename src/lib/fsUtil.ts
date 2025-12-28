import { App, TFile, TFolder, normalizePath } from 'obsidian';
import * as path from 'path';

export class FileSystemUtil {
  constructor(private app: App) {}

  async copyDirectory(sourceDir: string, destDir: string): Promise<void> {
    const adapter = this.app.vault.adapter;

    // Create destination directory
    if (!(await adapter.exists(destDir))) {
      await adapter.mkdir(destDir);
    }

    // Read source directory
    const entries = await adapter.list(sourceDir);

    // Copy files
    for (const file of entries.files) {
      const fileName = path.basename(file);
      const destPath = normalizePath(path.join(destDir, fileName));
      const content = await adapter.read(file);
      await adapter.write(destPath, content);
    }

    // Copy subdirectories recursively
    for (const folder of entries.folders) {
      const folderName = path.basename(folder);
      const destPath = normalizePath(path.join(destDir, folderName));
      await this.copyDirectory(folder, destPath);
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    const adapter = this.app.vault.adapter;

    if (!(await adapter.exists(dirPath))) {
      return;
    }

    // Get all entries
    const entries = await adapter.list(dirPath);

    // Delete all files
    for (const file of entries.files) {
      await adapter.remove(file);
    }

    // Delete all subdirectories recursively
    for (const folder of entries.folders) {
      await this.deleteDirectory(folder);
    }

    // Delete the directory itself
    await adapter.rmdir(dirPath, false);
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    const normalized = normalizePath(dirPath);

    if (!(await adapter.exists(normalized))) {
      await adapter.mkdir(normalized);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    const normalized = normalizePath(filePath);

    // Ensure parent directory exists
    const parentDir = path.dirname(normalized);
    await this.ensureDirectory(parentDir);

    await adapter.write(normalized, content);
  }

  async readFile(filePath: string): Promise<string> {
    const adapter = this.app.vault.adapter;
    return await adapter.read(normalizePath(filePath));
  }

  async fileExists(filePath: string): Promise<boolean> {
    const adapter = this.app.vault.adapter;
    return await adapter.exists(normalizePath(filePath));
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const content = await this.readFile(sourcePath);
    await this.writeFile(destPath, content);
  }

  getVaultPath(): string {
    // @ts-ignore - accessing private property
    return this.app.vault.adapter.basePath;
  }

  isPathExcluded(filePath: string, excludePatterns: string[]): boolean {
    const normalized = normalizePath(filePath);

    for (const pattern of excludePatterns) {
      const normalizedPattern = normalizePath(pattern);
      if (normalized.startsWith(normalizedPattern)) {
        return true;
      }
      // Also check if the path contains the pattern as a folder
      if (normalized.includes('/' + normalizedPattern + '/') ||
          normalized.includes('/' + normalizedPattern)) {
        return true;
      }
    }

    return false;
  }

  isPathIncluded(filePath: string, includePatterns: string[]): boolean {
    if (includePatterns.length === 0) {
      return true; // If no include patterns, include everything
    }

    const normalized = normalizePath(filePath);

    for (const pattern of includePatterns) {
      const normalizedPattern = normalizePath(pattern);

      // Empty string means include from vault root (all files)
      if (normalizedPattern === '' || normalizedPattern === '.') {
        return true;
      }

      if (normalized.startsWith(normalizedPattern)) {
        return true;
      }
    }

    return false;
  }
}
