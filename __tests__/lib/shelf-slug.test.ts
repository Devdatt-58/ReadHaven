import { shelfNameToSlug } from '@/lib/shelf-slug';

describe('shelfNameToSlug', () => {
  it('lowercases and hyphenates a shelf name', () => {
    expect(shelfNameToSlug('Want to Read')).toBe('want-to-read');
  });

  it('trims and collapses repeated whitespace', () => {
    expect(shelfNameToSlug('  Currently   Reading ')).toBe('currently-reading');
  });

  it('returns an empty string for an empty name', () => {
    expect(shelfNameToSlug('')).toBe('');
  });
});
