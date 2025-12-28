'use client';

import { useState } from 'react';

export function UpdatePluginButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="update-button"
        aria-label="Update VaultSite plugin"
        title="Update VaultSite plugin"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Vercel Publish</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>To update your Vercel Publish template to the latest version:</p>
              <ol>
                <li>Open Obsidian</li>
                <li>Open the Command Palette (Cmd/Ctrl + P)</li>
                <li>Run: <code>Vercel Publish: Update Template</code></li>
              </ol>
              <p className="modal-note">
                <strong>Note:</strong> This will update the template files while preserving your content and customizations.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
