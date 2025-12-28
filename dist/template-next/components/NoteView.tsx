import { MarkdownRenderer } from '@/lib/markdown';
import { NoteMetadata } from '@/lib/contentIndex';

interface NoteViewProps {
  metadata: NoteMetadata;
  content: string;
}

export function NoteView({ metadata, content }: NoteViewProps) {
  return (
    <article className="note-view">
      <header className="note-header">
        <h1 className="note-title">{metadata.title}</h1>
        {metadata.folder && (
          <div className="note-path">{metadata.folder}</div>
        )}
      </header>
      <div className="note-content markdown-body">
        <MarkdownRenderer content={content} />
      </div>
    </article>
  );
}
