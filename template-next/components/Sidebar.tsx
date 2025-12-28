'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderNode } from '@/lib/contentIndex';
import { getNoteUrl } from '@/lib/pathUtil';
import { DarkModeToggle } from './DarkModeToggle';
import { SearchBar } from './SearchBar';
import { UpdatePluginButton } from './UpdatePluginButton';

interface SidebarProps {
  tree: FolderNode;
  currentSlug?: string[];
}

interface FolderItemProps {
  node: FolderNode;
  currentSlug?: string[];
  depth: number;
  searchQuery?: string;
}

function FolderItem({ node, currentSlug, depth, searchQuery }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? node.notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : node.notes;

  // Filter children that have matching notes (recursively)
  const filteredChildren = searchQuery
    ? node.children.filter(child => hasMatchingNotes(child, searchQuery))
    : node.children;

  const hasContent = filteredChildren.length > 0 || filteredNotes.length > 0;

  if (!hasContent) {
    return null;
  }

  const currentSlugStr = currentSlug?.join('/');

  return (
    <div className="folder-item">
      {node.name !== 'root' && (
        <div
          className="folder-header"
          style={{ paddingLeft: `${depth * 16}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="folder-chevron"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M6 4l4 4-4 4V4z" />
          </svg>
          <svg
            className="folder-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z" />
          </svg>
          <span className="folder-name">{node.name}</span>
        </div>
      )}
      {isOpen && (
        <div className="folder-content">
          {filteredChildren.map((child) => (
            <FolderItem
              key={child.path}
              node={child}
              currentSlug={currentSlug}
              depth={node.name === 'root' ? depth : depth + 1}
              searchQuery={searchQuery}
            />
          ))}
          {filteredNotes.map((note) => {
            const noteSlugStr = note.slug.join('/');
            const isActive = currentSlugStr === noteSlugStr;
            return (
              <Link
                key={noteSlugStr}
                href={getNoteUrl(note.slug)}
                className={`note-link ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${(node.name === 'root' ? depth : depth + 1) * 16 + 24}px` }}
              >
                <svg
                  className="note-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25V1.75z" />
                </svg>
                <span className="note-title">{note.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper function to check if a folder or its children contain matching notes
function hasMatchingNotes(node: FolderNode, query: string): boolean {
  const hasMatchingNote = node.notes.some(note =>
    note.title.toLowerCase().includes(query.toLowerCase())
  );
  const hasMatchingChild = node.children.some(child =>
    hasMatchingNotes(child, query)
  );
  return hasMatchingNote || hasMatchingChild;
}

export function Sidebar({ tree, currentSlug }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="site-title">
          Vercel Publish
        </Link>
        <div className="sidebar-controls">
          <UpdatePluginButton />
          <DarkModeToggle />
        </div>
      </div>
      <div className="sidebar-search">
        <SearchBar onSearch={setSearchQuery} />
      </div>
      <div className="sidebar-content">
        <FolderItem node={tree} currentSlug={currentSlug} depth={0} searchQuery={searchQuery} />
      </div>
    </nav>
  );
}
