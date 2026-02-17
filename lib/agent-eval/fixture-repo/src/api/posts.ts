import { db } from '../db';

export interface Post {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface ListPostsParams {
  page?: number;
  pageSize?: number;
}

export async function listPosts(params: ListPostsParams = {}) {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.max(1, Math.floor(params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const rows = await db.query<Post>(
    'SELECT id, title, body, created_at FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  );
  return rows;
}
