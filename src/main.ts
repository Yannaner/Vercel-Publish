import { Notice, Plugin, normalizePath } from 'obsidian';
import { DEFAULT_SETTINGS, VaultSiteSettings, VaultSiteSettingTab } from "./settings";
import { SetupWizardModal } from "./setupWizard";
import { FileSystemUtil } from "./lib/fsUtil";
import { GitUtil } from "./lib/gitUtil";
import { ConfigManager } from "./lib/configManager";
import { SyncEngine } from "./lib/sync";

export default class VaultSitePlugin extends Plugin {
	settings: VaultSiteSettings;
	private fsUtil: FileSystemUtil;
	private gitUtil: GitUtil;
	private configManager: ConfigManager;

	private join(...parts: string[]): string {
		return normalizePath(parts.join('/'));
	}

	async onload() {
		await this.loadSettings();

		// Initialize utilities
		this.fsUtil = new FileSystemUtil(this.app);
		this.gitUtil = new GitUtil(this.fsUtil.getVaultPath());
		this.configManager = new ConfigManager(this.app);

		// Add commands
		this.addCommand({
			id: 'setup-wizard',
			name: 'Setup wizard',
			callback: () => {
				new SetupWizardModal(this.app, this).open();
			}
		});

		this.addCommand({
			id: 'initialize-website',
			name: 'Initialize website',
			callback: async () => {
				await this.initializeWebsite();
			}
		});

		this.addCommand({
			id: 'sync-notes',
			name: 'Sync notes',
			callback: async () => {
				await this.syncNotes();
			}
		});

		this.addCommand({
			id: 'publish',
			name: 'Publish (sync + push)',
			callback: async () => {
				await this.publish();
			}
		});

		this.addCommand({
			id: 'update-template',
			name: 'Update template',
			callback: async () => {
				await this.updateTemplate();
			}
		});

		this.addCommand({
			id: 'show-config',
			name: 'Show current config',
			callback: async () => {
				await this.showConfig();
			}
		});

		// Add settings tab
		this.addSettingTab(new VaultSiteSettingTab(this.app, this));

		console.debug('Vercel Publish plugin loaded');
	}

	onunload() {
		console.debug('Vercel Publish plugin unloaded');
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data as Partial<VaultSiteSettings>);
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

			// Get paths - Use plugin's template directory
			// @ts-ignore - accessing manifest
			const pluginDir = this.manifest.dir || '.';
			const templateSourcePath = this.join(pluginDir, 'template-next');

			const adapter = this.app.vault.adapter;

			// Check if template exists in plugin directory
			const templateExists = await adapter.exists(templateSourcePath);
			if (!templateExists) {
				throw new Error(`Template directory not found at: ${templateSourcePath}\nPlease reinstall the plugin.`);
			}

			console.debug('Copying template from:', templateSourcePath);
			console.debug('To: site');

			// Copy template using Obsidian's adapter
			const copyRecursive = async (src: string, dest: string): Promise<void> => {
				const exists = await adapter.exists(src);
				if (!exists) {
					throw new Error(`Source path does not exist: ${src}`);
				}

				// Check if it's a directory by trying to list it
				try {
					const entries = await adapter.list(src);

					// It's a directory
					await adapter.mkdir(dest).catch(() => {}); // Ignore if exists

					// Copy files
					for (const file of entries.files) {
						const fileName = file.split('/').pop() || '';
						const destPath = this.join(dest, fileName);
						const content = await adapter.readBinary(file);
						await adapter.writeBinary(destPath, content);
						console.debug('Copied:', fileName);
					}

					// Copy subdirectories
					for (const folder of entries.folders) {
						const folderName = folder.split('/').pop() || '';
						// Skip node_modules, .next, and out directories
						if (folderName === 'node_modules' || folderName === '.next' || folderName === 'out') {
							continue;
						}
						const destPath = this.join(dest, folderName);
						await copyRecursive(folder, destPath);
					}
				} catch (error) {
					// It's a file
					const content = await adapter.readBinary(src);
					await adapter.writeBinary(dest, content);
				}
			};

			await copyRecursive(templateSourcePath, 'site');

			// Create default config
			await this.configManager.ensureConfigExists();

			notice.hide();
			new Notice('✓ Website initialized at /site');
			new Notice('Run "Vercel Publish: Sync Notes" to add your notes');

			console.debug('Website initialization complete');
		} catch (error: unknown) {
			notice.hide();
			const message = error instanceof Error ? error.message : String(error);
			console.error('Initialize website error:', error);
			new Notice(`Failed to initialize website: ${message}`);
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

		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('Sync error:', error);
			new Notice(`Sync failed: ${message}`);
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

			notice.hide();

			// Step 2: Show git commands for manual execution
			if (this.settings.enableGitPublish) {
				const commands = this.gitUtil.getSyncAndPushInstructions();

				new Notice('✓ Notes synced! Now run these git commands in your terminal:', 8000);

				// Copy to clipboard automatically
				await navigator.clipboard.writeText(commands.join('\n'));
				new Notice('Git commands copied to clipboard', 5000);

				// Log to console for reference
				console.debug('Git publish commands:', commands.join('\n'));
				console.debug('Vault path:', this.gitUtil.getVaultPath());
			} else {
				new Notice('Sync complete. Enable "Git Publish" in settings to get git commands.');
			}

			if (this.settings.deployedUrl) {
				new Notice('After pushing to GitHub, Vercel will deploy automatically to: ' + this.settings.deployedUrl);
			}

		} catch (error: unknown) {
			notice.hide();
			const message = error instanceof Error ? error.message : String(error);
			console.error('Publish error:', error);
			new Notice(`Publish failed: ${message}`);
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
			// @ts-ignore - accessing manifest
			const pluginDir = this.manifest.dir || '.';
			const templateSourcePath = this.join(pluginDir, 'template-next');

			const adapter = this.app.vault.adapter;

			// Check if template exists
			const templateExists = await adapter.exists(templateSourcePath);
			if (!templateExists) {
				throw new Error(`Template directory not found at: ${templateSourcePath}\nPlease reinstall the plugin.`);
			}

			console.debug('Updating template from:', templateSourcePath);
			console.debug('To: site');

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
			const copyRecursive = async (src: string, dest: string, skipContent = false): Promise<void> => {
				const exists = await adapter.exists(src);
				if (!exists) {
					return;
				}

				try {
					const entries = await adapter.list(src);

					// It's a directory
					const basename = src.split('/').pop() || '';

					// Skip content directory when updating
					if (skipContent && basename === 'content') {
						console.debug('Skipping content directory (preserving user notes)');
						return;
					}

					// Create directory
					await adapter.mkdir(dest).catch(() => {}); // Ignore if exists

					// Copy files
					for (const file of entries.files) {
						const fileName = file.split('/').pop() || '';
						const destPath = this.join(dest, fileName);
						const content = await adapter.readBinary(file);
						await adapter.writeBinary(destPath, content);
						console.debug('Updated:', fileName);
					}

					// Copy subdirectories
					for (const folder of entries.folders) {
						const folderName = folder.split('/').pop() || '';
						// Skip node_modules, .next, out, and content directories
						if (folderName === 'node_modules' || folderName === '.next' || folderName === 'out' || folderName === 'content') {
							continue;
						}
						const destPath = this.join(dest, folderName);
						await copyRecursive(folder, destPath, skipContent);
					}
				} catch (error) {
					// It's a file
					const content = await adapter.readBinary(src);
					await adapter.writeBinary(dest, content);
				}
			};

			// Update each path
			for (const updatePath of updatePaths) {
				const srcPath = this.join(templateSourcePath, updatePath);
				const destPath = this.join('site', updatePath);

				const exists = await adapter.exists(srcPath);
				if (exists) {
					await copyRecursive(srcPath, destPath, true);
				}
			}

			notice.hide();
			new Notice('✓ Template updated successfully!');
			new Notice('Your content and customizations have been preserved.');

			console.debug('Template update complete');
		} catch (error: unknown) {
			notice.hide();
			const message = error instanceof Error ? error.message : String(error);
			console.error('Update template error:', error);
			new Notice(`Failed to update template: ${message}`);
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
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('Show config error:', error);
			new Notice(`Failed to show config: ${message}`);
		}
	}
}
