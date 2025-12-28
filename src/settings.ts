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

		containerEl.createEl('h2', { text: 'VaultSite Settings' });

		// GitHub Repository URL
		new Setting(containerEl)
			.setName('GitHub Repository URL')
			.setDesc('The URL of your GitHub repository (e.g., https://github.com/username/repo)')
			.addText(text => text
				.setPlaceholder('https://github.com/username/repo')
				.setValue(this.plugin.settings.githubRepoUrl)
				.onChange(async (value) => {
					this.plugin.settings.githubRepoUrl = value;
					await this.plugin.saveSettings();
				}));

		// Deployed Website URL
		new Setting(containerEl)
			.setName('Deployed Website URL')
			.setDesc('The URL where your site is deployed (e.g., https://yoursite.vercel.app)')
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
				.setName('Open Website')
				.setDesc('Open your deployed website in a browser')
				.addButton(button => button
					.setButtonText('Open')
					.setCta()
					.onClick(() => {
						window.open(this.plugin.settings.deployedUrl, '_blank');
					}));
		}

		// Enable Git Publish
		new Setting(containerEl)
			.setName('Enable Git Publish')
			.setDesc('Allow the Publish command to run git add, commit, and push')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableGitPublish)
				.onChange(async (value) => {
					this.plugin.settings.enableGitPublish = value;
					await this.plugin.saveSettings();
				}));

		// Auto Sync on Save
		new Setting(containerEl)
			.setName('Auto Sync on Save')
			.setDesc('Automatically sync notes when you save a file (experimental)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSyncOnSave)
				.onChange(async (value) => {
					this.plugin.settings.autoSyncOnSave = value;
					await this.plugin.saveSettings();
				}));

		// Configuration Info
		containerEl.createEl('h3', { text: 'Configuration' });
		containerEl.createEl('p', {
			text: 'Edit publish.config.json in your vault root to customize include/exclude paths and other settings.',
			cls: 'setting-item-description'
		});
	}
}
