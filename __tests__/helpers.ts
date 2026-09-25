export function mockRequest(
  url: string,
  init?: RequestInit & { json?: unknown }
): Request {
  const body = init?.json !== undefined ? JSON.stringify(init.json) : init?.body;
  const headers = new Headers(init?.headers);
  if (init?.json !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return new Request(url, { ...init, body, headers });
}

export function setSession(userId: string | null) {
  const nextAuth = require('next-auth');
  nextAuth.getServerSession.mockResolvedValue(
    userId ? { user: { id: userId } } : null
  );
}
