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
			id: 'vaultsite-setup-wizard',
			name: 'Setup Wizard',
			callback: () => {
				new SetupWizardModal(this.app, this).open();
			}
		});

		this.addCommand({
			id: 'vaultsite-initialize-website',
			name: 'Initialize Website',
			callback: async () => {
				await this.initializeWebsite();
			}
		});

		this.addCommand({
			id: 'vaultsite-sync-notes',
			name: 'Sync Notes',
			callback: async () => {
				await this.syncNotes();
			}
		});

		this.addCommand({
			id: 'vaultsite-publish',
			name: 'Publish (Sync + Push)',
			callback: async () => {
				await this.publish();
			}
		});

		// Add settings tab
		this.addSettingTab(new VaultSiteSettingTab(this.app, this));

		console.log('VaultSite plugin loaded');
	}

	onunload() {
		console.log('VaultSite plugin unloaded');
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
			new Notice('Run "VaultSite: Sync Notes" to add your notes');

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
}
