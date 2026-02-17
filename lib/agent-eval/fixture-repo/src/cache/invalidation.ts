import { invalidateCache } from './cache';

export function invalidateUserCache(userId: string) {
  invalidateCache(`user:${userId}:`);
}

export function invalidatePostsCache() {
  invalidateCache('posts:');
}
