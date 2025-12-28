# VaultSite

**Turn your Obsidian vault into a browsable website hosted on Vercel.**

VaultSite is an Obsidian plugin that generates a Next.js website from your notes and publishes it to Vercel with a single command.

## What It Does

VaultSite creates a `/site` directory in your vault containing a complete Next.js application. When you sync your notes, they're copied into the site with wikilinks converted to proper markdown links. Push to GitHub, and Vercel automatically deploys your browsable notes website.

## Features

- **One-Command Publish**: Sync notes and push to GitHub with a single command
- **Guided Setup Wizard**: Step-by-step setup for non-technical users
- **Wikilink Conversion**: Automatically converts `[[Note]]` links to proper markdown
- **Folder Sidebar**: Browse your notes with a collapsible folder tree
- **No Hosting Required**: Uses GitHub + Vercel (both free for public repos)
- **Privacy-First**: Exclude private folders by default
- **Static Export**: Fast, secure static site generation

## Quick Start

### 1. Run the Setup Wizard

Open the command palette (Cmd/Ctrl+P) and run:

```
VaultSite: Setup Wizard
```

The wizard will guide you through creating the website, connecting GitHub, and deploying to Vercel.

### 2. Publish Your Notes

After setup, just run:

```
VaultSite: Publish (Sync + Push)
```

This syncs your notes and pushes to GitHub. Vercel automatically deploys!

## Configuration

Edit `publish.config.json` in your vault root:

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

## Vercel Setup

**IMPORTANT**: When connecting to Vercel, set **Root Directory** to `site`

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set Root Directory to `site`
4. Deploy

After first deploy, paste your website URL into the plugin settings.

## Privacy

Only notes in your `include` paths are synced. By default, these folders are excluded:
- `.obsidian/`
- `site/`
- `private/`
- `journal/`

Add any sensitive folders to the `exclude` list in `publish.config.json`.

## Commands

| Command | Description |
|---------|-------------|
| `VaultSite: Setup Wizard` | Guided setup wizard |
| `VaultSite: Initialize Website` | Create `/site` directory |
| `VaultSite: Sync Notes` | Copy notes to `/site/content` |
| `VaultSite: Publish (Sync + Push)` | Sync and push to GitHub |

## How It Works

1. Plugin generates a Next.js site in `/site`
2. Sync copies notes into `/site/content` with converted links
3. Git push triggers Vercel webhook
4. Vercel builds and deploys automatically

## Troubleshooting

### "Not a git repository"

Run in your vault:
```bash
git init
git add -A
git commit -m "Initial commit"
```

### "No git remote configured"

Run:
```bash
git remote add origin https://github.com/username/repo
```

### Vercel build fails

Make sure Root Directory is set to `site` in Vercel project settings.

## Development

To test locally:

```bash
cd <vault>/site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## License

MIT
