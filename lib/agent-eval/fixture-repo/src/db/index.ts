export interface DBRow {
  [key: string]: unknown;
}

export interface DBClient {
  query<T = DBRow>(sql: string, params?: unknown[]): Promise<T[]>;
}

export const db: DBClient = {
  async query(sql, params) {
    // Placeholder implementation for fixture repo
    return [] as unknown as never[];
  },
};
