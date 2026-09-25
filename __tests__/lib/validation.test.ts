import { z } from 'zod';
import {
  parseBoundedInt,
  parsePagination,
  normalizeEmail,
  validateWithSchema,
} from '@/lib/validation';

describe('parseBoundedInt', () => {
  it('returns default for null', () => {
    expect(parseBoundedInt(null, { defaultValue: 5 })).toBe(5);
  });
  it('parses valid integers', () => {
    expect(parseBoundedInt('42', { defaultValue: 1, min: 1, max: 100 })).toBe(42);
  });
  it('clamps to max', () => {
    expect(parseBoundedInt('9999', { defaultValue: 1, min: 1, max: 100 })).toBe(100);
  });
  it('clamps to min', () => {
    expect(parseBoundedInt('-5', { defaultValue: 1, min: 1, max: 100 })).toBe(1);
  });
  it('returns default for non-numeric strings', () => {
    expect(parseBoundedInt('abc', { defaultValue: 7 })).toBe(7);
  });
});

describe('parsePagination', () => {
  it('returns defaults', () => {
    const p = parsePagination(new URLSearchParams());
    expect(p).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });
  it('computes skip correctly', () => {
    const p = parsePagination(new URLSearchParams('page=3&pageSize=10'));
    expect(p.skip).toBe(20);
    expect(p.take).toBe(10);
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  A@B.C  ')).toBe('a@b.c');
  });
});

describe('validateWithSchema', () => {
  const schema = z.object({ x: z.number() });
  it('passes valid input', () => {
    const r = validateWithSchema(schema, { x: 1 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.x).toBe(1);
  });
  it('returns errors for invalid input', () => {
    const r = validateWithSchema(schema, { x: 'no' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toContain('x:');
  });
});
