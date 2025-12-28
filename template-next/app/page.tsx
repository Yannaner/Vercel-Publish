import { getAllNotes, getContentTree } from '@/lib/contentIndex';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { getNoteUrl } from '@/lib/pathUtil';

export default function HomePage() {
  const tree = getContentTree();
  const allNotes = getAllNotes();

  return (
    <div className="app-container">
      <Sidebar tree={tree} />
      <main className="main-content">
        {allNotes.length > 0 ? (
          <div className="home-content">
            <h1>Welcome to Your Notes</h1>
            <p>Select a note from the sidebar to get started, or browse below:</p>
            <div className="notes-list">
              <h2>Recent Notes ({allNotes.length})</h2>
              <ul>
                {allNotes.slice(0, 10).map((note) => (
                  <li key={note.slug.join('/')}>
                    <Link href={getNoteUrl(note.slug)}>
                      {note.title}
                    </Link>
                    {note.folder && <span className="note-folder"> — {note.folder}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h1>Welcome to Vercel Publish</h1>
            <p>No notes found. Use the Vercel Publish plugin to sync your notes.</p>
            <div className="instructions">
              <h2>Getting Started</h2>
              <ol>
                <li>Open Obsidian and install the Vercel Publish plugin</li>
                <li>Run the command: <code>Vercel Publish: Sync Notes</code></li>
                <li>Your notes will appear here automatically</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
