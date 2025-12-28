import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, VaultSiteSettings, VaultSiteSettingTab } from "./settings";
import { SetupWizardModal } from "./setupWizard";
import { FileSystemUtil } from "./lib/fsUtil";
import { GitUtil } from "./lib/gitUtil";
import { ConfigManager } from "./lib/configManager";
import { SyncEngine } from "./lib/sync";
import * as path from 'path';

export default class VaultSitePlugin extends Plugin {
	settings: VaultSiteSettings;
	private fsUtil: FileSystemUtil;
	private gitUtil: GitUtil;
	private configManager: ConfigManager;

	async onload() {
		await this.loadSettings();

		// Initialize utilities
		this.fsUtil = new FileSystemUtil(this.app);
		this.gitUtil = new GitUtil(this.fsUtil.getVaultPath());
		this.configManager = new ConfigManager(this.app);

		// Add commands
		this.addCommand({
			id: 'vercel-publish-setup-wizard',
			name: 'Setup Wizard',
			callback: () => {
				new SetupWizardModal(this.app, this).open();
			}
		});

		this.addCommand({
			id: 'vercel-publish-initialize-website',
			name: 'Initialize Website',
			callback: async () => {
				await this.initializeWebsite();
			}
		});

		this.addCommand({
			id: 'vercel-publish-sync-notes',
			name: 'Sync Notes',
			callback: async () => {
				await this.syncNotes();
			}
		});

		this.addCommand({
			id: 'vercel-publish-publish',
			name: 'Publish (Sync + Push)',
			callback: async () => {
				await this.publish();
			}
		});

		this.addCommand({
			id: 'vercel-publish-update-template',
			name: 'Update Template',
			callback: async () => {
				await this.updateTemplate();
			}
		});

		this.addCommand({
			id: 'vercel-publish-show-config',
			name: 'Show Current Config',
			callback: async () => {
				await this.showConfig();
			}
		});

		// Add settings tab
		this.addSettingTab(new VaultSiteSettingTab(this.app, this));

		console.log('Vercel Publish plugin loaded');
	}

	onunload() {
		console.log('Vercel Publish plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<VaultSiteSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async initializeWebsite(): Promise<void> {
		const notice = new Notice('Initializing website...', 0);

		try {
			// Check if site directory already exists
			const siteExists = await this.fsUtil.fileExists('site');
			if (siteExists) {
				notice.hide();
				new Notice('Website directory already exists at /site');
				return;
			}

			// Get paths
			const adapter = this.app.vault.adapter;
			// @ts-ignore - basePath is available
			const vaultPath = adapter.basePath;
			// @ts-ignore - accessing manifest
			const pluginDir = this.manifest.dir || '.';
			const templateSourcePath = path.join(vaultPath, pluginDir, 'template-next');
			const siteDestPath = path.join(vaultPath, 'site');

			const fs = require('fs');
			const fsp = require('fs').promises;

			// Check if template exists
			if (!fs.existsSync(templateSourcePath)) {
				throw new Error(`Template directory not found at: ${templateSourcePath}\nPlease reinstall the plugin.`);
			}

			console.log('Copying template from:', templateSourcePath);
			console.log('To:', siteDestPath);

			// Copy template using Node.js fs (more reliable for cross-directory copy)
			async function copyRecursive(src: string, dest: string) {
				const stats = await fsp.stat(src);

				if (stats.isDirectory()) {
					// Create directory
					await fsp.mkdir(dest, { recursive: true });

					// Read directory contents
					const entries = await fsp.readdir(src);

					// Copy each entry
					for (const entry of entries) {
						// Skip node_modules, .next, and out directories
						if (entry === 'node_modules' || entry === '.next' || entry === 'out') {
							continue;
						}

						const srcPath = path.join(src, entry);
						const destPath = path.join(dest, entry);
						await copyRecursive(srcPath, destPath);
					}
				} else {
					// Copy file
					await fsp.copyFile(src, dest);
					console.log('Copied:', path.basename(dest));
				}
			}

			await copyRecursive(templateSourcePath, siteDestPath);

			// Create default config
			await this.configManager.ensureConfigExists();

			notice.hide();
			new Notice('✓ Website initialized at /site');
			new Notice('Run "Vercel Publish: Sync Notes" to add your notes');

			console.log('Website initialization complete');
		} catch (error: any) {
			notice.hide();
			console.error('Initialize website error:', error);
			new Notice(`Failed to initialize website: ${error.message}`);
		}
	}

	async syncNotes(): Promise<void> {
		try {
			// Check if site exists
			const siteExists = await this.fsUtil.fileExists('site');
			if (!siteExists) {
				new Notice('Website not initialized. Run "Initialize Website" first.');
				return;
			}

			// Load config
			const config = await this.configManager.loadConfig();

			// Create sync engine and sync
			const syncEngine = new SyncEngine(this.app, config);
			await syncEngine.syncNotes();

		} catch (error: any) {
			console.error('Sync error:', error);
			new Notice(`Sync failed: ${error.message}`);
		}
	}

	async publish(): Promise<void> {
		const notice = new Notice('Publishing...', 0);

		try {
			// Check if site exists
			const siteExists = await this.fsUtil.fileExists('site');
			if (!siteExists) {
				notice.hide();
				new Notice('Website not initialized. Run "Initialize Website" first.');
				return;
			}

			// Step 1: Sync notes
			await this.syncNotes();

			// Step 2: Git publish (if enabled)
			if (!this.settings.enableGitPublish) {
				notice.hide();
				new Notice('Sync complete. Enable Git Publish in settings to push to GitHub.');
				return;
			}

			// Check if git is initialized
			const isRepo = await this.gitUtil.isGitRepository();
			if (!isRepo) {
				notice.hide();
				new Notice('Not a git repository. Run the Setup Wizard to configure git.');
				return;
			}

			// Check if remote is configured
			const hasRemote = await this.gitUtil.hasRemote();
			if (!hasRemote) {
				notice.hide();
				new Notice('No git remote configured. Run the Setup Wizard to add a remote.');
				return;
			}

			// Sync and push
			notice.setMessage('Pushing to GitHub...');
			await this.gitUtil.syncAndPush();

			notice.hide();
			new Notice('✓ Published! Vercel will deploy automatically.');

			if (this.settings.deployedUrl) {
				new Notice('Your site will be updated at: ' + this.settings.deployedUrl);
			}

		} catch (error: any) {
			notice.hide();
			console.error('Publish error:', error);
			new Notice(`Publish failed: ${error.message}`);
		}
	}

	async updateTemplate(): Promise<void> {
		const notice = new Notice('Updating template...', 0);

		try {
			// Check if site directory exists
			const siteExists = await this.fsUtil.fileExists('site');
			if (!siteExists) {
				notice.hide();
				new Notice('Website not initialized. Run "Initialize Website" first.');
				return;
			}

			// Get paths
			const adapter = this.app.vault.adapter;
			// @ts-ignore - basePath is available
			const vaultPath = adapter.basePath;
			// @ts-ignore - accessing manifest
			const pluginDir = this.manifest.dir || '.';
			const templateSourcePath = path.join(vaultPath, pluginDir, 'template-next');
			const siteDestPath = path.join(vaultPath, 'site');

			const fs = require('fs');
			const fsp = require('fs').promises;

			// Check if template exists
			if (!fs.existsSync(templateSourcePath)) {
				throw new Error(`Template directory not found at: ${templateSourcePath}\nPlease reinstall the plugin.`);
			}

			console.log('Updating template from:', templateSourcePath);
			console.log('To:', siteDestPath);

			// List of files/folders to update (preserving content and customizations)
			const updatePaths = [
				'app',
				'components',
				'lib',
				'public',
				'next.config.mjs',
				'tsconfig.json',
				'package.json',
				'.eslintrc.json'
			];

			// Copy template files (excluding content directory)
			async function copyRecursive(src: string, dest: string, skipContent = false) {
				const stats = await fsp.stat(src);

				if (stats.isDirectory()) {
					// Skip content directory when updating
					if (skipContent && path.basename(src) === 'content') {
						console.log('Skipping content directory (preserving user notes)');
						return;
					}

					// Create directory
					await fsp.mkdir(dest, { recursive: true });

					// Read directory contents
					const entries = await fsp.readdir(src);

					// Copy each entry
					for (const entry of entries) {
						// Skip node_modules, .next, out, and content directories
						if (entry === 'node_modules' || entry === '.next' || entry === 'out' || entry === 'content') {
							continue;
						}

						const srcPath = path.join(src, entry);
						const destPath = path.join(dest, entry);
						await copyRecursive(srcPath, destPath, skipContent);
					}
				} else {
					// Copy file
					await fsp.copyFile(src, dest);
					console.log('Updated:', path.basename(dest));
				}
			}

			// Update each path
			for (const updatePath of updatePaths) {
				const srcPath = path.join(templateSourcePath, updatePath);
				const destPath = path.join(siteDestPath, updatePath);

				if (fs.existsSync(srcPath)) {
					await copyRecursive(srcPath, destPath, true);
				}
			}

			notice.hide();
			new Notice('✓ Template updated successfully!');
			new Notice('Your content and customizations have been preserved.');

			console.log('Template update complete');
		} catch (error: any) {
			notice.hide();
			console.error('Update template error:', error);
			new Notice(`Failed to update template: ${error.message}`);
		}
	}

	async showConfig(): Promise<void> {
		try {
			const config = await this.configManager.loadConfig();

			console.log('Current Vercel Publish Config:', config);

			const configInfo = `
**Current Config:**

Include: ${config.include.length === 0 ? '(all files)' : config.include.join(', ')}
Exclude: ${config.exclude.join(', ')}
Content Dir: ${config.contentDir}

To sync notes from anywhere in your vault:
1. Make sure "include" is empty [] in publish.config.json
2. Or add specific folders like ["notes", "projects"]
3. Notes outside the site folder will be automatically synced

Current config has been logged to console (Ctrl/Cmd+Shift+I)
			`.trim();

			new Notice(configInfo, 10000);
		} catch (error: any) {
			console.error('Show config error:', error);
			new Notice(`Failed to show config: ${error.message}`);
		}
	}
}
