# VaultSite Notes Explorer

This is a Next.js application that renders your Obsidian notes as a browsable website.

## How It Works

- The `/content` directory contains your synced Obsidian notes
- The app builds a folder tree and renders markdown with a sidebar
- Deploy to Vercel for a public notes website

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your notes.

## Deployment

This site is configured for static export and works perfectly with Vercel:

1. Push this repository to GitHub
2. Import it in Vercel
3. Set **Root Directory** to `site` (if deploying from a vault)
4. Deploy

Vercel will automatically rebuild when you push changes.

## Syncing Notes

Use the VaultSite Obsidian plugin to sync notes from your vault into `/content`.
