import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const sourceDir = path.join(rootDir, 'template-next');
const destDir = path.join(rootDir, 'dist', 'template-next');

function copyRecursive(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, out directories
      if (['node_modules', '.next', 'out'].includes(entry.name)) {
        continue;
      }
      copyRecursive(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying Next.js template to dist...');
copyRecursive(sourceDir, destDir);
console.log('Template copied successfully!');
