import { db } from '../db';

export function fetchRevenueReport(
  startDate: string,
  endDate: string,
  cb: (err: Error | null, rows?: Array<{ day: string; total: number }>) => void
) {
  const sql =
    'SELECT day, total FROM revenue WHERE day >= $1 AND day <= $2 ORDER BY day ASC';
  void (async () => {
    try {
      const rows = await db.query<{ day: string; total: number }>(sql, [startDate, endDate]);
      cb(null, rows);
    } catch (err) {
      cb(err as Error);
    }
  })();
}

export function fetchTopCustomers(
  limit: number,
  cb: (err: Error | null, rows?: Array<{ customer_id: string; total: number }>) => void
) {
  const sql =
    'SELECT customer_id, SUM(total) as total FROM orders GROUP BY customer_id ORDER BY total DESC LIMIT $1';
  void (async () => {
    try {
      const rows = await db.query<{ customer_id: string; total: number }>(sql, [limit]);
      cb(null, rows);
    } catch (err) {
      cb(err as Error);
    }
  })();
}
