'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderNode } from '@/lib/contentIndex';
import { getNoteUrl } from '@/lib/pathUtil';

interface SidebarProps {
  tree: FolderNode;
  currentSlug?: string[];
}

interface FolderItemProps {
  node: FolderNode;
  currentSlug?: string[];
  depth: number;
}

function FolderItem({ node, currentSlug, depth }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasContent = node.children.length > 0 || node.notes.length > 0;

  if (!hasContent) {
    return null;
  }

  const currentSlugStr = currentSlug?.join('/');

  return (
    <div className="folder-item">
      {node.name !== 'root' && (
        <div
          className="folder-header"
          style={{ paddingLeft: `${depth * 12}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="folder-icon">{isOpen ? '📂' : '📁'}</span>
          <span className="folder-name">{node.name}</span>
        </div>
      )}
      {isOpen && (
        <div className="folder-content">
          {node.children.map((child) => (
            <FolderItem
              key={child.path}
              node={child}
              currentSlug={currentSlug}
              depth={node.name === 'root' ? depth : depth + 1}
            />
          ))}
          {node.notes.map((note) => {
            const noteSlugStr = note.slug.join('/');
            const isActive = currentSlugStr === noteSlugStr;
            return (
              <Link
                key={noteSlugStr}
                href={getNoteUrl(note.slug)}
                className={`note-link ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${(node.name === 'root' ? depth : depth + 1) * 12 + 20}px` }}
              >
                <span className="note-icon">📄</span>
                <span className="note-title">{note.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ tree, currentSlug }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="site-title">
          VaultSite
        </Link>
      </div>
      <div className="sidebar-content">
        <FolderItem node={tree} currentSlug={currentSlug} depth={0} />
      </div>
    </nav>
  );
}
