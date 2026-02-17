import { validateToken } from '../utils/token';

export interface RequestContext {
  headers: Record<string, string | undefined>;
  userId?: string;
}

export function authMiddleware(ctx: RequestContext) {
  const token = ctx.headers['authorization'];
  if (!token) {
    throw new Error('Missing auth token');
  }

  const userId = validateToken(token);
  if (!userId) {
    throw new Error('Invalid auth token');
  }

  ctx.userId = userId;
  return ctx;
}
