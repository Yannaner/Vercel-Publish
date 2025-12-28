import { notFound } from 'next/navigation';
import { getAllNotes, getNoteBySlug, getContentTree } from '@/lib/contentIndex';
import { Sidebar } from '@/components/Sidebar';
import { NoteView } from '@/components/NoteView';

interface NotePageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const allNotes = getAllNotes();
  return allNotes.map((note) => ({
    slug: note.slug,
  }));
}

export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const tree = getContentTree();

  return (
    <div className="app-container">
      <Sidebar tree={tree} currentSlug={slug} />
      <main className="main-content">
        <NoteView metadata={note.metadata} content={note.content} />
      </main>
    </div>
  );
}
