import { notFound } from 'next/navigation';
import { getAllNotes, getNoteBySlug, getContentTree } from '@/lib/contentIndex';
import { Sidebar } from '@/components/Sidebar';
import { NoteView } from '@/components/NoteView';

interface NotePageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Force static generation - no dynamic routes allowed with output: 'export'
export const dynamicParams = false;

export async function generateStaticParams() {
  const allNotes = getAllNotes();

  // Safety: Log how many pages we're generating
  console.log(`[generateStaticParams] Generating ${allNotes.length} note pages`);

  if (allNotes.length > 5000) {
    console.warn(`[generateStaticParams] WARNING: Attempting to generate ${allNotes.length} pages. This may timeout on Vercel.`);
  }

  // Return all note slugs for static generation
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
