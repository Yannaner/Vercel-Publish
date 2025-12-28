import fs from 'fs';
import path from 'path';

export interface NoteMetadata {
  slug: string[];
  filePath: string;
  title: string;
  folder: string;
}

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  notes: NoteMetadata[];
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Safety limits
const MAX_FILES = 10000;
const IGNORED_FOLDERS = new Set([
  '.git',
  '.obsidian',
  'node_modules',
  '.next',
  '.vercel',
  'dist',
  'build',
  '.cache',
  'out',
]);

let fileCount = 0;

function shouldIgnoreFolder(folderName: string): boolean {
  return IGNORED_FOLDERS.has(folderName) || folderName.startsWith('.');
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildFolderTree(dir: string, relativePath: string = ''): FolderNode {
  const node: FolderNode = {
    name: relativePath ? path.basename(relativePath) : 'root',
    path: relativePath,
    children: [],
    notes: [],
  };

  if (!fs.existsSync(dir)) {
    return node;
  }

  // Safety: check if we've scanned too many files
  if (fileCount > MAX_FILES) {
    console.warn(`[contentIndex] Safety limit reached: ${MAX_FILES} files scanned. Stopping.`);
    return node;
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    console.warn(`[contentIndex] Cannot read directory ${dir}:`, error);
    return node;
  }

  for (const entry of entries) {
    // Skip ignored folders and hidden files/folders
    if (entry.isDirectory() && shouldIgnoreFolder(entry.name)) {
      continue;
    }

    // Skip non-markdown files early
    if (entry.isFile() && !entry.name.endsWith('.md')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const entryRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;

    // Skip symlinks for safety
    try {
      const stats = fs.lstatSync(fullPath);
      if (stats.isSymbolicLink()) {
        continue;
      }
    } catch (error) {
      console.warn(`[contentIndex] Cannot stat ${fullPath}:`, error);
      continue;
    }

    if (entry.isDirectory()) {
      const childNode = buildFolderTree(fullPath, entryRelativePath);
      // Only add non-empty folders
      if (childNode.children.length > 0 || childNode.notes.length > 0) {
        node.children.push(childNode);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fileCount++;
      const slug = entryRelativePath.replace(/\.md$/, '').split(path.sep);
      const fileName = entry.name.replace(/\.md$/, '');
      node.notes.push({
        slug,
        filePath: fullPath,
        title: slugToTitle(fileName),
        folder: relativePath,
      });
    }
  }

  // Sort children and notes alphabetically
  node.children.sort((a, b) => a.name.localeCompare(b.name));
  node.notes.sort((a, b) => a.title.localeCompare(b.title));

  return node;
}

export function getContentTree(): FolderNode {
  // Reset file counter for each tree build
  fileCount = 0;
  const startTime = Date.now();
  const tree = buildFolderTree(CONTENT_DIR);
  const duration = Date.now() - startTime;

  console.log(`[contentIndex] Scanned ${fileCount} files in ${duration}ms from ${CONTENT_DIR}`);

  return tree;
}

export function getAllNotes(): NoteMetadata[] {
  const notes: NoteMetadata[] = [];

  function collectNotes(node: FolderNode) {
    notes.push(...node.notes);
    node.children.forEach(collectNotes);
  }

  const tree = getContentTree();
  collectNotes(tree);

  return notes;
}

export function getNoteBySlug(slug: string[]): { metadata: NoteMetadata; content: string } | null {
  // URL-decode each slug segment (Next.js may pass URL-encoded segments during build)
  const decodedSlug = slug.map(segment => decodeURIComponent(segment));
  const filePath = path.join(CONTENT_DIR, ...decodedSlug) + '.md';

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = decodedSlug[decodedSlug.length - 1];
  const folder = decodedSlug.length > 1 ? decodedSlug.slice(0, -1).join(path.sep) : '';

  return {
    metadata: {
      slug: decodedSlug,
      filePath,
      title: slugToTitle(fileName),
      folder,
    },
    content,
  };
}
