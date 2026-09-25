// Default shelves have fixed names ("Want to Read", etc.); the slug is just a
// URL-safe form of the name used in /shelf/[name] links.
export function shelfNameToSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}
