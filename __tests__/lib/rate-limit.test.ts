import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests up to the limit', () => {
    expect(rateLimit('test-a', 3, 60_000).ok).toBe(true);
    expect(rateLimit('test-a', 3, 60_000).ok).toBe(true);
    expect(rateLimit('test-a', 3, 60_000).ok).toBe(true);
  });

  it('blocks requests over the limit and reports a retry delay', () => {
    rateLimit('test-b', 2, 60_000);
    rateLimit('test-b', 2, 60_000);
    const blocked = rateLimit('test-b', 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('resets once the window has passed', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000_000);
    expect(rateLimit('test-c', 1, 5_000).ok).toBe(true);
    expect(rateLimit('test-c', 1, 5_000).ok).toBe(false);
    nowSpy.mockReturnValue(1_000_000 + 5_001);
    expect(rateLimit('test-c', 1, 5_000).ok).toBe(true);
    nowSpy.mockRestore();
  });
});
