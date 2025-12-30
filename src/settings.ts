import { App, PluginSettingTab, Setting } from "obsidian";
import VaultSitePlugin from "./main";

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
}

export class VaultSiteSettingTab extends PluginSettingTab {
	plugin: VaultSitePlugin;

	constructor(app: App, plugin: VaultSitePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Header
		new Setting(containerEl)
			.setName('Vercel publish settings')
			.setHeading();

		// Add intro description
		const introEl = containerEl.createEl('div', { cls: 'setting-item-description' });
		introEl.createEl('p', {
			text: 'Configure your Vercel Publish settings. These URLs help the plugin notify you when publishing is complete.'
		});
		introEl.createEl('br');

		// GitHub Repository URL
		new Setting(containerEl)
			.setName('GitHub repository URL')
			.setDesc('Your GitHub repository URL where the site code is stored (e.g., https://github.com/username/repo)')
			.addText(text => text
				.setPlaceholder('https://github.com/username/repo')
				.setValue(this.plugin.settings.githubRepoUrl)
				.onChange(async (value) => {
					this.plugin.settings.githubRepoUrl = value;
					await this.plugin.saveSettings();
				}));

		// Deployed Website URL
		new Setting(containerEl)
			.setName('Deployed website URL')
			.setDesc('Your live Vercel website URL (e.g., https://yoursite.vercel.app). This is shown after publishing.')
			.addText(text => text
				.setPlaceholder('https://yoursite.vercel.app')
				.setValue(this.plugin.settings.deployedUrl)
				.onChange(async (value) => {
					this.plugin.settings.deployedUrl = value;
					await this.plugin.saveSettings();
				}));

		// Add button to open website if URL is set
		if (this.plugin.settings.deployedUrl) {
			new Setting(containerEl)
				.setName('Open website')
				.setDesc('View your published website in a new browser tab')
				.addButton(button => button
					.setButtonText('Visit site')
					.setCta()
					.onClick(() => {
						window.open(this.plugin.settings.deployedUrl, '_blank');
					}));
		}

		// Publishing Options Section
		new Setting(containerEl)
			.setName('Publishing options')
			.setHeading();

		// Enable Git Publish
		new Setting(containerEl)
			.setName('Enable git publish')
			.setDesc('When enabled, the publish command will copy git commands to your clipboard for manual execution in terminal')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableGitPublish)
				.onChange(async (value) => {
					this.plugin.settings.enableGitPublish = value;
					await this.plugin.saveSettings();
				}));

		// Info about Obsidian Git plugin
		const gitInfoEl = containerEl.createEl('div', { cls: 'setting-item-description' });
		gitInfoEl.createEl('p', {
			text: '💡 For automatic git sync without using terminal, install the "Obsidian Git" community plugin'
		});

		// Auto Sync on Save
		new Setting(containerEl)
			.setName('Auto sync on save')
			.setDesc('⚠️ Experimental: Automatically sync notes to site/content when you save a file')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSyncOnSave)
				.onChange(async (value) => {
					this.plugin.settings.autoSyncOnSave = value;
					await this.plugin.saveSettings();
				}));

		// Advanced Configuration Section
		new Setting(containerEl)
			.setName('Advanced configuration')
			.setHeading();

		const configDesc = containerEl.createEl('div', { cls: 'setting-item-description' });
		configDesc.createEl('p', {
			text: 'Edit publish.config.json in your vault root to customize which folders to publish, exclude private notes, and configure other advanced settings.'
		});

		const configExample = containerEl.createEl('details');
		configExample.createEl('summary', { text: 'View example configuration' });
		const codeBlock = configExample.createEl('pre');
		const configDir = this.app.vault.configDir;
		codeBlock.createEl('code', {
			text: `{
  "include": [],  // Empty = publish all
  "exclude": ["${configDir}", "site", "private"],
  "siteDir": "site",
  "contentDir": "site/content",
  "baseRoute": "/notes",
  "slugStyle": "kebab"
}`
		});

		// Quick Start Guide
		new Setting(containerEl)
			.setName('Quick start')
			.setHeading();

		const quickStart = containerEl.createEl('div', { cls: 'setting-item-description' });
		const ol = quickStart.createEl('ol');
		ol.createEl('li').createSpan().innerHTML = 'Run <strong>Vercel Publish: Setup Wizard</strong> to initialize your website';
		ol.createEl('li').setText('Configure your GitHub repository URL above');
		ol.createEl('li').createSpan().innerHTML = 'Run <strong>Vercel Publish: Sync Notes</strong> to copy notes to /site';
		ol.createEl('li').createSpan().innerHTML = 'Run <strong>Vercel Publish: Publish</strong> to deploy to Vercel';
	}
}
