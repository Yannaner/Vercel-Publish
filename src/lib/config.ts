export interface PublishConfig {
  include: string[];
  exclude: string[];
  siteDir: string;
  contentDir: string;
  assetsDir: string;
  baseRoute: string;
  slugStyle: 'kebab' | 'original';
}

export const DEFAULT_PUBLISH_CONFIG: PublishConfig = {
  include: ['notes'],
  exclude: ['.obsidian', 'site', 'private', 'journal'],
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
