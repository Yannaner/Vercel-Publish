export interface PublishConfig {
  include: string[];
  exclude: string[];
  siteDir: string;
  contentDir: string;
  assetsDir: string;
  baseRoute: string;
  slugStyle: 'kebab' | 'original';
}

// Note: The .obsidian exclusion will be replaced with vault.configDir at runtime
export const DEFAULT_PUBLISH_CONFIG: PublishConfig = {
  include: [], // Empty = include all files from vault root
  // eslint-disable-next-line obsidianmd/hardcoded-config-path
  exclude: ['.obsidian', 'site', 'private', 'journal'], // .obsidian is replaced at runtime
  siteDir: 'site',
  contentDir: 'site/content',
  assetsDir: 'site/public/assets',
  baseRoute: '/notes',
  slugStyle: 'kebab',
};

export interface VaultSiteSettings {
  githubRepoUrl: string;
  deployedUrl: string;
  enableGitPublish: boolean;
  autoSyncOnSave: boolean;
}

export const DEFAULT_SETTINGS: VaultSiteSettings = {
  githubRepoUrl: '',
  deployedUrl: '',
  enableGitPublish: true,
  autoSyncOnSave: false,
};
