export function joinPath(...parts: string[]): string {
  return parts.filter(Boolean).join('/');
}

export function getNoteUrl(slug: string[]): string {
  return '/notes/' + slug.join('/');
}
