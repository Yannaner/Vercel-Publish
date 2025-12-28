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

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const entryRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      const childNode = buildFolderTree(fullPath, entryRelativePath);
      node.children.push(childNode);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
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
  return buildFolderTree(CONTENT_DIR);
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
  const filePath = path.join(CONTENT_DIR, ...slug) + '.md';

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = slug[slug.length - 1];
  const folder = slug.length > 1 ? slug.slice(0, -1).join(path.sep) : '';

  return {
    metadata: {
      slug,
      filePath,
      title: slugToTitle(fileName),
      folder,
    },
    content,
  };
}
