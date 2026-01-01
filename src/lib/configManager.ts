import { App } from 'obsidian';
import { PublishConfig, DEFAULT_PUBLISH_CONFIG } from './config';
import { FileSystemUtil } from './fsUtil';

const CONFIG_FILE_PATH = 'publish.config.json';

export class ConfigManager {
  private fsUtil: FileSystemUtil;

  constructor(private app: App) {
    this.fsUtil = new FileSystemUtil(app);
  }

  async loadConfig(): Promise<PublishConfig> {
    try {
      const exists = await this.fsUtil.fileExists(CONFIG_FILE_PATH);
      if (!exists) {
        return this.replaceObsidianPath(DEFAULT_PUBLISH_CONFIG);
      }

      const content = await this.fsUtil.readFile(CONFIG_FILE_PATH);
      const config = JSON.parse(content);

      // Merge with defaults to ensure all fields exist
      const merged = { ...DEFAULT_PUBLISH_CONFIG, ...config };
      return this.replaceObsidianPath(merged);
    } catch (error) {
      console.error('Failed to load publish config:', error);
      return this.replaceObsidianPath(DEFAULT_PUBLISH_CONFIG);
    }
  }

  private replaceObsidianPath(config: PublishConfig): PublishConfig {
    // Replace .obsidian with actual configDir
    const configDir = this.app.vault.configDir;
    const exclude = config.exclude.map(path =>
      // eslint-disable-next-line obsidianmd/hardcoded-config-path
      path === '.obsidian' ? configDir : path
    );
    return { ...config, exclude };
  }

  async saveConfig(config: PublishConfig): Promise<void> {
    const content = JSON.stringify(config, null, 2);
    await this.fsUtil.writeFile(CONFIG_FILE_PATH, content);
  }

  async ensureConfigExists(): Promise<void> {
    const exists = await this.fsUtil.fileExists(CONFIG_FILE_PATH);
    if (!exists) {
      await this.saveConfig(DEFAULT_PUBLISH_CONFIG);
    }
  }
}
