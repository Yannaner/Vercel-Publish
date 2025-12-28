# Vercel Deployment Guide

## Important: Project Structure

This Next.js app must be deployed with the **Root Directory** set to `template-next/` in your Vercel project settings.

### Steps to Deploy

1. **Connect your repository to Vercel**

2. **Configure Root Directory**
   - In Vercel project settings → General → Build & Development Settings
   - Set **Root Directory** to: `template-next`
   - This ensures Vercel builds from the Next.js app folder, not the repository root

3. **Add Your Content**
   - Place your Obsidian vault markdown files in `template-next/content/`
   - The build will automatically scan this folder and generate pages

4. **Build Settings** (should be auto-detected)
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `out`
   - Install Command: `npm install`

### Safety Features

The app includes several safety guards for reliable builds:

- **Folder Ignoring**: Automatically skips `.git`, `.obsidian`, `node_modules`, etc.
- **File Limits**: Stops scanning after 10,000 files to prevent timeouts
- **Symlink Protection**: Skips symbolic links to avoid infinite loops
- **Build Logging**: Shows scan time and file count during builds

### Troubleshooting

If the build times out or fails:

1. **Check file count**: The build logs will show `[contentIndex] Scanned N files in Xms`
   - If N is very large (>5000), consider reducing content or splitting into multiple sites

2. **Check for large folders**: Make sure your vault doesn't have huge attachment folders in `content/`
   - Move large assets to `public/` or a CDN instead

3. **Verify Root Directory**: Ensure it's set to `template-next` in Vercel settings

### Performance Tips

- Keep your content folder under 5,000 markdown files for fast builds
- Use the `public/` folder for images and static assets
- Large vaults may benefit from incremental static regeneration (requires switching from static export to server rendering)
