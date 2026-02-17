import { authMiddleware } from '../src/middleware/auth';

function makeCtx(authorization?: string) {
  return {
    headers: { authorization },
  };
}

describe('authMiddleware', () => {
  it('allows valid token', () => {
    const ctx = authMiddleware(makeCtx('Bearer user-123'));
    expect(ctx.userId).toBe('user-123');
  });

  it('rejects missing token', () => {
    expect(() => authMiddleware(makeCtx())).toThrow('Missing auth token');
  });

  it.each(['user-123', 'Basic user-123', 'Bearer'])(
    'rejects invalid token format: %s',
    (authorization) => {
      expect(() => authMiddleware(makeCtx(authorization))).toThrow(
        'Invalid auth token'
      );
    }
  );

  it('throws when headers are missing', () => {
    expect(() =>
      authMiddleware({} as { headers: Record<string, string | undefined> })
    ).toThrow(TypeError);
  });
});
