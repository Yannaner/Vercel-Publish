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

    contentEl.createEl('h2', { text: 'Vault site setup wizard' });
    contentEl.createEl('p', {
      text: 'Follow these steps to set up your vault site website.',
      cls: 'setting-item-description'
    });

    // Step 1: Initialize Website
    await this.renderStep1(contentEl);

    // Step 2: Git Status
    this.renderStep2(contentEl);

    // Step 3: GitHub Repo
    this.renderStep3(contentEl);

    // Step 4: Push to GitHub
    this.renderStep4(contentEl);

    // Step 5: Connect Vercel
    await this.renderStep5(contentEl);
  }

  private async renderStep1(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '1. Initialize website' });
    section.createEl('p', {
      text: 'Create the /site directory with the Next.js website template',
    });

    const siteExists = await this.fsUtil.fileExists('site');

    if (siteExists) {
      section.createEl('p', {
        text: 'Website directory already exists at /site',
        cls: 'vaultsite-success'
      });
    } else {
      new Setting(section)
        .setName('Create website')
        .setDesc('Initialize the /site directory')
        .addButton(button => button
          .setButtonText('Create /site')
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            try {
              await this.plugin.initializeWebsite();
              void this.onOpen(); // Refresh wizard
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : String(error);
              new Notice(`Failed to initialize website: ${message}`);
              button.setDisabled(false);
            }
          }));
    }
  }

  private renderStep2(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '2. Initialize Git repository' });
    section.createEl('p', {
      text: 'Initialize Git to track your vault changes. Run these commands in your terminal',
    });

    section.createEl('p', {
      text: `📁 Vault location: ${this.gitUtil.getVaultPath()}`,
      cls: 'setting-item-description'
    });

    const codeBlock = section.createEl('pre');
    const code = codeBlock.createEl('code');
    code.setText(this.gitUtil.getGitInstructions().join('\n'));

    new Setting(section)
      .setName('Copy commands')
      .setDesc('Copy Git initialization commands to clipboard')
      .addButton(button => button
        .setButtonText('Copy')
        .onClick(() => {
          void navigator.clipboard.writeText(this.gitUtil.getGitInstructions().join('\n'));
          new Notice('Commands copied to clipboard');
        }));

    section.createEl('p', {
      text: 'Tip: for automatic Git sync, install the "Obsidian Git" community plugin',
      cls: 'setting-item-description'
    });
  }

  private renderStep3(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '3. Create GitHub repository' });
    section.createEl('p', {
      text: 'Create a new GitHub repository for your vault',
    });

    new Setting(section)
      .setName('Create GitHub repository')
      .setDesc('Create a new repository on GitHub')
      .addButton(button => button
        .setButtonText('Open GitHub')
        .onClick(() => {
          window.open('https://github.com/new', '_blank');
        }));

    section.createEl('p', {
      text: 'After creating the repository, paste the URL here',
    });

    new Setting(section)
      .setName('GitHub repository URL')
      .setDesc('Format: https://github.com/username/repo')
      .addText(text => text
        .setPlaceholder('https://github.com/username/repo')
        .setValue(this.plugin.settings.githubRepoUrl)
        .onChange(async (value) => {
          this.repoUrlInput = value;
          this.plugin.settings.githubRepoUrl = value;
          await this.plugin.saveSettings();
          // Refresh wizard to update Step 4
          void this.onOpen();
        }));

    if (this.plugin.settings.githubRepoUrl) {
      section.createEl('p', {
        text: `✓ Repository URL saved: ${this.plugin.settings.githubRepoUrl}`,
        cls: 'vaultsite-success'
      });
    }
  }

  private renderStep4(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '4. Push to GitHub' });
    section.createEl('p', {
      text: 'Push your vault to the GitHub repository. Run these commands in your terminal',
    });

    if (this.plugin.settings.githubRepoUrl) {
      section.createEl('p', {
        text: `📁 Vault location: ${this.gitUtil.getVaultPath()}`,
        cls: 'setting-item-description'
      });

      const codeBlock = section.createEl('pre');
      const code = codeBlock.createEl('code');
      code.setText(this.gitUtil.getRemoteInstructions(this.plugin.settings.githubRepoUrl).join('\n'));

      new Setting(section)
        .setName('Copy commands')
        .setDesc('Copy Git remote and push commands to clipboard')
        .addButton(button => button
          .setButtonText('Copy')
          .onClick(() => {
            void navigator.clipboard.writeText(
              this.gitUtil.getRemoteInstructions(this.plugin.settings.githubRepoUrl).join('\n')
            );
            new Notice('Commands copied to clipboard');
          }));
    } else {
      section.createEl('p', {
        text: 'Enter GitHub repo URL in step 3 first',
        cls: 'vaultsite-warning'
      });
    }

    section.createEl('p', {
      text: 'Tip: for automatic Git sync, install the "Obsidian Git" community plugin',
      cls: 'setting-item-description'
    });
  }

  private async renderStep5(container: HTMLElement) {
    const section = container.createDiv({ cls: 'setup-wizard-step' });
    section.createEl('h3', { text: '5. Vercel deployment' });
    section.createEl('p', {
      text: 'Configure hosting for your published website',
    });

    new Setting(section)
      .setName('Vercel deployment')
      .setDesc('Configure website hosting')
      .addButton(button => button
        .setButtonText('Open deployment site')
        .onClick(() => {
          window.open('https://vercel.com/new', '_blank');
        }));

    const instructionsList = section.createEl('div', { cls: 'setup-instructions' });
    instructionsList.createEl('p', { text: 'Vercel setup steps' });
    const ol = instructionsList.createEl('ol');
    ol.createEl('li', { text: 'Select "import Git repository"' });
    ol.createEl('li', { text: 'Choose your GitHub repository' });
    ol.createEl('li', { text: 'Set root directory to: site' });
    ol.createEl('li', { text: 'Click deploy' });

    section.createEl('p', {
      text: 'After deployment, paste your website URL here',
    });

    new Setting(section)
      .setName('Deployed website URL')
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
        .setName('View website')
        .addButton(button => button
          .setButtonText('View website')
          .setCta()
          .onClick(() => {
            window.open(this.plugin.settings.deployedUrl, '_blank');
          }));
    }

    // Completion message
    const siteExists = await this.fsUtil.fileExists('site');

    if (siteExists && this.plugin.settings.githubRepoUrl && this.plugin.settings.deployedUrl) {
      const completionSection = container.createDiv({ cls: 'setup-wizard-complete' });
      completionSection.createEl('h3', { text: 'Setup complete!' });
      completionSection.createEl('p', {
        text: 'You can now sync notes to your site and publish changes',
      });
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
