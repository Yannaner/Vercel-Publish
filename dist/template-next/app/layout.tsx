import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VaultSite Notes',
  description: 'Browse your Obsidian notes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
