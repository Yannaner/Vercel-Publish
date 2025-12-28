import { PublishConfig } from './config';

interface NoteIndex {
  [basename: string]: string[];  // basename -> list of relative paths
}

export class LinkRewriter {
  private noteIndex: NoteIndex = {};

  constructor(
    private config: PublishConfig,
    private allNotePaths: string[]
  ) {
    this.buildNoteIndex();
  }

  private buildNoteIndex(): void {
    for (const notePath of this.allNotePaths) {
      // Remove .md extension
      const pathWithoutExt = notePath.replace(/\.md$/, '');

      // Get basename
      const parts = pathWithoutExt.split('/');
      const basename = parts[parts.length - 1];

      if (!basename) continue; // Skip if no basename

      // Add to index
      if (!this.noteIndex[basename]) {
        this.noteIndex[basename] = [];
      }
      this.noteIndex[basename].push(pathWithoutExt);
    }
  }

  private toSlug(text: string): string {
    if (this.config.slugStyle === 'kebab') {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    return text;
  }

  private resolveWikilink(link: string): string | null {
    // Handle [[folder/note]] format
    if (link.includes('/')) {
      const normalized = link.replace(/\.md$/, '');
      // Check if this exact path exists
      if (normalized in this.noteIndex || this.allNotePaths.includes(normalized)) {
        return normalized;
      }

      // Try to find by full path
      const pathWithoutExt = normalized.replace(/\.md$/, '');
      for (const notePath of this.allNotePaths) {
        if (notePath.replace(/\.md$/, '') === pathWithoutExt) {
          return pathWithoutExt;
        }
      }
    }

    // Handle [[note]] format - lookup by basename
    const basename = link.replace(/\.md$/, '');
    const matches: string[] | undefined = this.noteIndex[basename];

    if (!matches || matches.length === 0) {
      console.warn(`Link resolution failed: "${link}" - note not found`);
      return null;
    }

    if (matches.length > 1) {
      console.warn(`Link resolution ambiguous: "${link}" matches multiple notes:`, matches);
      return matches[0] || null; // Use first match
    }

    return matches[0] || null;
  }

  rewriteLinks(content: string): string {
    let rewritten = content;

    // Pattern for [[link]] or [[link|alias]]
    const wikilinkPattern = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;

    rewritten = rewritten.replace(wikilinkPattern, (match, link, _, alias) => {
      const trimmedLink = link.trim();
      const resolvedPath = this.resolveWikilink(trimmedLink);

      if (!resolvedPath) {
        // Keep original text if resolution fails
        return alias ? alias : trimmedLink;
      }

      // Build URL
      const url = `${this.config.baseRoute}/${resolvedPath}`;
      const displayText = alias ? alias.trim() : trimmedLink;

      return `[${displayText}](${url})`;
    });

    // Pattern for ![[embed]]
    const embedPattern = /!\[\[([^\]]+)\]\]/g;

    rewritten = rewritten.replace(embedPattern, (match, embed) => {
      const trimmedEmbed = embed.trim();

      // Check if it's an image
      if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(trimmedEmbed)) {
        // Convert to markdown image
        const fileName = trimmedEmbed.split('/').pop();
        return `![${fileName}](/assets/${fileName})`;
      }

      // For non-image embeds, just convert to a link
      const resolvedPath = this.resolveWikilink(trimmedEmbed);
      if (resolvedPath) {
        const url = `${this.config.baseRoute}/${resolvedPath}`;
        return `[${trimmedEmbed}](${url})`;
      }

      // Keep original if resolution fails
      return match;
    });

    return rewritten;
  }
}
