# VaultSite Commands Reference

## Plugin Commands

All commands are available in the Obsidian command palette (Cmd/Ctrl+P).

### VaultSite: Setup Wizard

**When to use**: First-time setup or troubleshooting

Opens a guided wizard that walks you through:
1. Creating the `/site` website directory
2. Initializing git (if needed)
3. Creating a GitHub repository
4. Pushing to GitHub
5. Connecting to Vercel
6. Configuring deployment URL

**Usage**: Run this command once after installing the plugin, or anytime you need to reconfigure.

---

### VaultSite: Initialize Website

**When to use**: To create the website structure

Creates the `/site` directory in your vault with the complete Next.js template, including:
- React/Next.js app structure
- Sidebar component
- Markdown renderer
- Content directory (empty)
- Vercel deployment configuration

**Usage**: Usually run via the Setup Wizard, but can be run manually.

---

### VaultSite: Sync Notes

**When to use**: After adding or modifying notes

Copies markdown files from your vault to `/site/content/`, applying:
- Include/exclude filters from `publish.config.json`
- Wikilink conversion (`[[Note]]` → `[Note](/notes/note)`)
- Folder structure preservation

**Output**: Shows count of synced notes

**Usage**: Run this whenever you want to update the website with new or modified notes (but don't push yet).

---

### VaultSite: Publish (Sync + Push)

**When to use**: To publish changes to your live website

Performs a complete publish workflow:
1. Runs Sync Notes
2. Git add all changes
3. Git commit with timestamp
4. Git push to GitHub
5. Vercel auto-deploys (via webhook)

**Requirements**:
- Git initialized in vault
- GitHub remote configured
- "Enable Git Publish" enabled in settings
- Git credentials set up (SSH or credential manager)

**Output**:
- Success: "Published! Vercel will deploy automatically."
- With deployed URL set: Shows the website URL

**Usage**: This is your main "publish" button. Run it whenever you want to deploy changes.

---

## Settings

Access via Settings → VaultSite

### GitHub Repository URL
The HTTPS URL of your GitHub repo (e.g., `https://github.com/username/vault`)

Used by the plugin to:
- Show in the Setup Wizard
- Configure git remote

### Deployed Website URL
Your Vercel deployment URL (e.g., `https://yoursite.vercel.app`)

Used to:
- Show "Open Website" button in settings
- Display after successful publish

### Enable Git Publish
Toggle to allow/disallow the Publish command from running git commands.

**When to disable**:
- If you want to manually control git
- If you're testing sync without pushing

### Auto Sync on Save
Experimental feature to automatically run Sync Notes when you save a file.

**Warning**: May slow down Obsidian on large vaults.

---

## Configuration File

### publish.config.json

Location: Vault root

Edit this file to customize what gets published:

```json
{
  "include": ["notes"],
  "exclude": [".obsidian", "site", "private", "journal"],
  "siteDir": "site",
  "contentDir": "site/content",
  "assetsDir": "site/public/assets",
  "baseRoute": "/notes",
  "slugStyle": "kebab"
}
```

#### Fields

**include** (array of strings)
- Folders to sync to the website
- Example: `["notes", "docs", "blog"]`
- Empty array = include everything (not recommended)

**exclude** (array of strings)
- Folders to never sync
- Checked before include rules
- Default excludes protect privacy and prevent recursion

**siteDir** (string)
- Where the Next.js website lives
- Default: `"site"`

**contentDir** (string)
- Where synced notes are stored
- Default: `"site/content"`

**assetsDir** (string)
- Where images will be copied (future feature)
- Default: `"site/public/assets"`

**baseRoute** (string)
- URL prefix for all notes
- Default: `"/notes"`
- Change to `"/docs"` if you prefer URLs like `/docs/note`

**slugStyle** (string)
- How to convert note names to URLs
- Options: `"kebab"` or `"original"`
- `"kebab"`: "My Note" → `my-note`
- `"original"`: "My Note" → `My-Note`

---

## Typical Workflows

### First Time Setup

1. Install plugin
2. `VaultSite: Setup Wizard`
3. Create GitHub repo (via wizard link)
4. Push to GitHub (via wizard button or manually)
5. Create Vercel project (via wizard link)
6. Set Root Directory to `site`
7. Paste deployed URL in wizard

### Daily Publishing

1. Write/edit notes in Obsidian
2. `VaultSite: Publish (Sync + Push)`
3. Wait ~30 seconds for Vercel to deploy
4. View changes on your website

### Preview Before Publishing

1. Write/edit notes
2. `VaultSite: Sync Notes`
3. In terminal: `cd <vault>/site && npm run dev`
4. View at http://localhost:3000
5. When satisfied: `VaultSite: Publish (Sync + Push)`

### Change What Gets Published

1. Edit `publish.config.json` in vault root
2. Modify `include` or `exclude` arrays
3. `VaultSite: Sync Notes` to test
4. `VaultSite: Publish (Sync + Push)` when ready

---

## Keyboard Shortcuts

Currently, no default keyboard shortcuts are set. You can add custom shortcuts via:

Settings → Hotkeys → Search "VaultSite"

Recommended:
- Publish: `Cmd/Ctrl + Shift + P`
- Sync Notes: `Cmd/Ctrl + Shift + S`

---

## Git Commands (Manual Alternative)

If "Enable Git Publish" is disabled, you can manually publish:

```bash
cd <vault>
git add -A
git commit -m "Update notes"
git push
```

Vercel will still auto-deploy on push.
