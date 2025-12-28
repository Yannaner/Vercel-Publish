import { App, Modal, Notice, Setting } from 'obsidian';
import VaultSitePlugin from './main';
import { GitUtil } from './lib/gitUtil';
import { FileSystemUtil } from './lib/fsUtil';

export class SetupWizardModal extends Modal {
  private plugin: VaultSitePlugin;
  private gitUtil: GitUtil;
  private fsUtil: FileSystemUtil;
  private repoUrlInput: string = '';

  constructor(app: App, plugin: VaultSitePlugin) {
    super(app);
    this.plugin = plugin;
    this.fsUtil = new FileSystemUtil(app);
    this.gitUtil = new GitUtil(this.fsUtil.getVaultPath());
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'VaultSite Setup Wizard' });
    contentEl.createEl('p', {
      text: 'Follow these steps to set up your VaultSite website.',
      cls: 'setting-item-description'
    });

    // Step 1: Initialize Website
    await this.renderStep1(contentEl);

    // Step 2: Git Status
    await this.renderStep2(contentEl);

    // Step 3: GitHub Repo
    await this.renderStep3(contentEl);

    // Step 4: Push to GitHub
    await this.renderStep4(contentEl);

    // Step 5: Connect Vercel
    await this.renderStep5(contentEl);
  }

  private async renderStep1(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '1. Initialize Website' });
    section.createEl('p', {
      text: 'Create the /site directory with the Next.js website template.',
    });

    const siteExists = await this.fsUtil.fileExists('site');

    if (siteExists) {
      section.createEl('p', {
        text: '✓ Website directory already exists at /site',
        cls: 'vaultsite-success'
      });
    } else {
      new Setting(section)
        .setName('Create Website')
        .setDesc('Initialize the /site directory')
        .addButton(button => button
          .setButtonText('Create /site Website')
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            try {
              await this.plugin.initializeWebsite();
              this.onOpen(); // Refresh wizard
            } catch (error: any) {
              new Notice(`Failed to initialize website: ${error.message}`);
              button.setDisabled(false);
            }
          }));
    }
  }

  private async renderStep2(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '2. Git Repository' });
    section.createEl('p', {
      text: 'Initialize git to track your vault changes.',
    });

    const isRepo = await this.gitUtil.isGitRepository();

    if (isRepo) {
      section.createEl('p', {
        text: '✓ Git repository detected',
        cls: 'vaultsite-success'
      });
    } else {
      section.createEl('p', {
        text: '⚠ No git repository found.',
        cls: 'vaultsite-warning'
      });

      section.createEl('p', {
        text: 'Click the button below to automatically set up git (no terminal needed):',
      });

      new Setting(section)
        .setName('Initialize Git')
        .setDesc('Set up git for your vault with one click')
        .addButton(button => button
          .setButtonText('Initialize Git Automatically')
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            try {
              await this.gitUtil.init();
              new Notice('Git initialized!');
              await this.gitUtil.add();
              new Notice('Files staged');
              await this.gitUtil.commit('Initial commit - VaultSite setup');
              new Notice('✓ Git repository created successfully!');
              this.onOpen(); // Refresh wizard
            } catch (error: any) {
              new Notice(`Git initialization failed: ${error.message}`);
              console.error(error);
              button.setDisabled(false);
            }
          }));

      // Advanced option for terminal users
      const detailsEl = section.createEl('details');
      detailsEl.createEl('summary', { text: 'Advanced: Manual setup (for terminal users)' });
      const codeBlock = detailsEl.createEl('pre');
      const code = codeBlock.createEl('code');
      code.setText(this.gitUtil.getGitInstructions().join('\n'));
    }
  }

  private async renderStep3(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '3. Create GitHub Repository' });
    section.createEl('p', {
      text: 'Create a new GitHub repository for your vault.',
    });

    new Setting(section)
      .setName('Open GitHub')
      .setDesc('Create a new repository on GitHub')
      .addButton(button => button
        .setButtonText('Open GitHub: New Repo')
        .onClick(() => {
          window.open('https://github.com/new', '_blank');
        }));

    section.createEl('p', {
      text: 'After creating the repository, paste the URL here:',
    });

    new Setting(section)
      .setName('GitHub Repository URL')
      .setDesc('Format: https://github.com/username/repo')
      .addText(text => text
        .setPlaceholder('https://github.com/username/repo')
        .setValue(this.plugin.settings.githubRepoUrl)
        .onChange(async (value) => {
          this.repoUrlInput = value;
          this.plugin.settings.githubRepoUrl = value;
          await this.plugin.saveSettings();
          // Refresh wizard to update Step 4
          this.onOpen();
        }));

    if (this.plugin.settings.githubRepoUrl) {
      section.createEl('p', {
        text: `✓ Repository URL saved: ${this.plugin.settings.githubRepoUrl}`,
        cls: 'vaultsite-success'
      });
    }
  }

  private async renderStep4(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '4. Push to GitHub' });
    section.createEl('p', {
      text: 'Push your vault to the GitHub repository.',
    });

    const isRepo = await this.gitUtil.isGitRepository();
    const hasRemote = await this.gitUtil.hasRemote();

    if (!isRepo) {
      section.createEl('p', {
        text: '⚠ Complete Step 2 first',
        cls: 'vaultsite-warning'
      });
      return;
    }

    if (this.plugin.settings.enableGitPublish && this.plugin.settings.githubRepoUrl) {
      new Setting(section)
        .setName('Configure Remote & Push')
        .setDesc('Set up git remote and push to GitHub')
        .addButton(button => button
          .setButtonText('Push to GitHub')
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            try {
              // Set remote
              await this.gitUtil.setRemote(this.plugin.settings.githubRepoUrl);
              new Notice('Git remote configured');

              // Push
              const branch = await this.gitUtil.getBranchName();
              await this.gitUtil.pushWithUpstream(branch);
              new Notice('Pushed to GitHub successfully!');

              this.onOpen(); // Refresh
            } catch (error: any) {
              new Notice(`Push failed: ${error.message}`);
              console.error(error);
              button.setDisabled(false);
            }
          }));
    } else {
      section.createEl('p', {
        text: 'Run these commands in your terminal:',
      });

      if (this.plugin.settings.githubRepoUrl) {
        const codeBlock = section.createEl('pre');
        const code = codeBlock.createEl('code');
        code.setText(this.gitUtil.getRemoteInstructions(this.plugin.settings.githubRepoUrl).join('\n'));

        new Setting(section)
          .setName('Copy Commands')
          .addButton(button => button
            .setButtonText('Copy to Clipboard')
            .onClick(() => {
              navigator.clipboard.writeText(
                this.gitUtil.getRemoteInstructions(this.plugin.settings.githubRepoUrl).join('\n')
              );
              new Notice('Commands copied to clipboard');
            }));
      } else {
        section.createEl('p', {
          text: '⚠ Enter GitHub repo URL in Step 3 first',
          cls: 'vaultsite-warning'
        });
      }
    }

    if (hasRemote) {
      const remoteUrl = await this.gitUtil.getRemoteUrl();
      section.createEl('p', {
        text: `✓ Remote configured: ${remoteUrl}`,
        cls: 'vaultsite-success'
      });
    }
  }

  private async renderStep5(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '5. Deploy to Vercel' });
    section.createEl('p', {
      text: 'Connect your GitHub repository to Vercel for hosting.',
    });

    new Setting(section)
      .setName('Open Vercel')
      .setDesc('Import your GitHub repository to Vercel')
      .addButton(button => button
        .setButtonText('Open Vercel: New Project')
        .onClick(() => {
          window.open('https://vercel.com/new', '_blank');
        }));

    const instructionsList = section.createEl('div', { cls: 'setup-instructions' });
    instructionsList.createEl('p', { text: 'In Vercel:' });
    const ol = instructionsList.createEl('ol');
    ol.createEl('li', { text: 'Select "Import Git Repository"' });
    ol.createEl('li', { text: 'Choose your GitHub repository' });
    ol.createEl('li', { text: 'Set Root Directory to: site' });
    ol.createEl('li', { text: 'Click Deploy' });

    section.createEl('p', {
      text: 'After deployment, paste your website URL here:',
    });

    new Setting(section)
      .setName('Deployed Website URL')
      .setDesc('Format: https://yoursite.vercel.app')
      .addText(text => text
        .setPlaceholder('https://yoursite.vercel.app')
        .setValue(this.plugin.settings.deployedUrl)
        .onChange(async (value) => {
          this.plugin.settings.deployedUrl = value;
          await this.plugin.saveSettings();
        }));

    if (this.plugin.settings.deployedUrl) {
      section.createEl('p', {
        text: `✓ Website URL saved: ${this.plugin.settings.deployedUrl}`,
        cls: 'vaultsite-success'
      });

      new Setting(section)
        .setName('Open Website')
        .addButton(button => button
          .setButtonText('Open Website')
          .setCta()
          .onClick(() => {
            window.open(this.plugin.settings.deployedUrl, '_blank');
          }));
    }

    // Completion message
    const siteExists = await this.fsUtil.fileExists('site');
    const hasRemote = await this.gitUtil.hasRemote();

    if (siteExists && hasRemote && this.plugin.settings.deployedUrl) {
      const completionSection = container.createDiv({ cls: 'setup-wizard-complete' });
      completionSection.createEl('h3', { text: '🎉 Setup Complete!' });
      completionSection.createEl('p', {
        text: 'You can now use the "VaultSite: Publish (Sync + Push)" command to update your website.',
      });
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
