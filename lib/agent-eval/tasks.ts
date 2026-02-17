import { AgentTask, AgentDimensionName, RepoContextFile } from '@/types';

const fixtureFiles: Record<string, RepoContextFile> = {
  'src/api/posts.ts': {
    path: 'src/api/posts.ts',
    content: `import { db } from '../db';

export interface Post {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export async function listPosts() {
  const rows = await db.query<Post>(
    'SELECT id, title, body, created_at FROM posts ORDER BY created_at DESC'
  );
  return rows;
}
`,
  },
  'src/utils/dateRange.ts': {
    path: 'src/utils/dateRange.ts',
    content: `export interface DateRange {
  start: Date;
  end: Date;
}

export function filterByDateRange<T extends { createdAt: Date }>(
  items: T[],
  range: DateRange
): T[] {
  return items.filter((item) => {
    const time = item.createdAt.getTime();
    return time >= range.start.getTime() && time <= range.end.getTime() + 1;
  });
}
`,
  },
  'src/services/reporting.ts': {
    path: 'src/services/reporting.ts',
    content: `import { db } from '../db';

export function fetchRevenueReport(
  startDate: string,
  endDate: string,
  cb: (err: Error | null, rows?: Array<{ day: string; total: number }>) => void
) {
  const sql =
    'SELECT day, total FROM revenue WHERE day >= $1 AND day <= $2 ORDER BY day ASC';
  db.query(sql, [startDate, endDate])
    .then((rows) => cb(null, rows as Array<{ day: string; total: number }>))
    .catch((err) => cb(err));
}

export function fetchTopCustomers(
  limit: number,
  cb: (err: Error | null, rows?: Array<{ customer_id: string; total: number }>) => void
) {
  const sql =
    'SELECT customer_id, SUM(total) as total FROM orders GROUP BY customer_id ORDER BY total DESC LIMIT $1';
  db.query(sql, [limit])
    .then((rows) => cb(null, rows as Array<{ customer_id: string; total: number }>))
    .catch((err) => cb(err));
}
`,
  },
  'src/middleware/auth.ts': {
    path: 'src/middleware/auth.ts',
    content: `import { validateToken } from '../utils/token';

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
`,
  },
  'tests/auth.middleware.test.ts': {
    path: 'tests/auth.middleware.test.ts',
    content: `import { authMiddleware } from '../src/middleware/auth';

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
});
`,
  },
  'src/cache/cache.ts': {
    path: 'src/cache/cache.ts',
    content: `type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
`,
  },
  'src/cache/invalidation.ts': {
    path: 'src/cache/invalidation.ts',
    content: `import { invalidateCache } from './cache';

export function invalidateUserCache(userId: string) {
  invalidateCache(
    \`user:\${userId}:\`
  );
}

export function invalidatePostsCache() {
  invalidateCache('posts:');
}
`,
  },
  'src/legacy/analytics.js': {
    path: 'src/legacy/analytics.js',
    content: `function trackEvent(name, properties) {
  if (!name) {
    throw new Error('Event name required');
  }

  return {
    name: name,
    properties: properties || {},
    timestamp: Date.now(),
  };
}

function normalizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    plan: user.plan || 'free',
  };
}

module.exports = {
  trackEvent,
  normalizeUser,
};
`,
  },
  'src/services/analytics.ts': {
    path: 'src/services/analytics.ts',
    content: `import analytics from '../legacy/analytics';

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  plan?: string;
}

export function trackSignup(user: UserProfile): AnalyticsEvent {
  const normalized = analytics.normalizeUser(user);
  return analytics.trackEvent('user.signup', {
    plan: normalized.plan,
    email: normalized.email,
  });
}
`,
  },
  'src/utils/retry.ts': {
    path: 'src/utils/retry.ts',
    content: `export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError || new Error('Failed after retries');
}
`,
  },
  'src/websocket/handler.ts': {
    path: 'src/websocket/handler.ts',
    content: `import { EventEmitter } from 'events';

export interface WebSocketLike {
  on(event: 'message' | 'close', cb: (data?: string) => void): void;
  send(data: string): void;
}

const events = new EventEmitter();

export function registerSocket(socket: WebSocketLike) {
  socket.on('message', (data) => {
    events.emit('message', data);
  });

  socket.on('close', () => {
    events.emit('disconnect');
  });
}

export function broadcast(message: string) {
  events.emit('broadcast', message);
}

export function onBroadcast(cb: (message: string) => void) {
  events.on('broadcast', cb);
}
`,
  },
  'src/theme/tokens.ts': {
    path: 'src/theme/tokens.ts',
    content: `export const colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    muted: '#6B6B6B',
    border: '#E0E0E0',
    accent: '#3B82F6',
  },
};

export type ThemeMode = 'light';

export function getColor(mode: ThemeMode, token: keyof typeof colors.light) {
  return colors[mode][token];
}
`,
  },
  'src/components/Button.tsx': {
    path: 'src/components/Button.tsx',
    content: `import { ReactNode } from 'react';
import { getColor } from '../theme/tokens';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, variant = 'primary' }: ButtonProps) {
  const background =
    variant === 'primary' ? getColor('light', 'foreground') : 'transparent';
  const color =
    variant === 'primary' ? getColor('light', 'background') : getColor('light', 'foreground');

  return (
    <button
      style={{
        background,
        color,
        border: \`1px solid \${getColor('light', 'border')}\`,
        padding: '8px 16px',
        borderRadius: 999,
      }}
    >
      {children}
    </button>
  );
}
`,
  },
  'src/components/Card.tsx': {
    path: 'src/components/Card.tsx',
    content: `import { ReactNode } from 'react';
import { getColor } from '../theme/tokens';

interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <div
      style={{
        border: \`1px solid \${getColor('light', 'border')}\`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}
`,
  },
  'src/db/index.ts': {
    path: 'src/db/index.ts',
    content: `export interface DBRow {
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
`,
  },
  'src/db/orders.ts': {
    path: 'src/db/orders.ts',
    content: `import { db } from './index';

export interface Order {
  id: string;
  customer_id: string;
  total: number;
}

export interface Customer {
  id: string;
  email: string;
}

export async function getRecentOrders(): Promise<Array<Order & { customer: Customer | null }>> {
  const orders = await db.query<Order>(
    'SELECT id, customer_id, total FROM orders ORDER BY id DESC LIMIT 50'
  );

  const results: Array<Order & { customer: Customer | null }> = [];

  for (const order of orders) {
    const customers = await db.query<Customer>(
      'SELECT id, email FROM customers WHERE id = $1',
      [order.customer_id]
    );
    results.push({ ...order, customer: customers[0] || null });
  }

  return results;
}
`,
  },
};

function baseRubrics(): Array<{ dimension: AgentDimensionName; guidance: string }> {
  return [
    {
      dimension: 'correctness',
      guidance: 'Does the solution work and avoid introducing bugs?',
    },
    {
      dimension: 'style_adherence',
      guidance: 'Follows existing patterns, naming, and structure.',
    },
    {
      dimension: 'context_utilization',
      guidance: 'Uses and respects existing modules, types, and APIs.',
    },
    {
      dimension: 'completeness',
      guidance: 'Fully addresses the task requirements and scope.',
    },
    {
      dimension: 'explanation_quality',
      guidance: 'Explanation is clear, verifiable, and scoped to the change.',
    },
    {
      dimension: 'edge_case_handling',
      guidance: 'Handles edge cases and production considerations.',
    },
  ];
}

export const AGENT_TASKS: AgentTask[] = [
  {
    id: 'add-pagination',
    title: 'Add Pagination to REST Endpoint',
    category: 'greenfield',
    difficulty: 'medium',
    productQuestion:
      'Does the agent understand the existing codebase well enough to add to it without breaking patterns?',
    prompt:
      'Add pagination to the posts REST endpoint. The API should accept `page` and `pageSize` params (default to 1 and 20). Keep the SQL style consistent with the repo. Return a patch and a brief explanation.',
    expectedBehavior:
      'Introduce pagination without changing existing response shape, keep ordering consistent, and follow existing db query patterns.',
    contextFiles: [fixtureFiles['src/api/posts.ts'], fixtureFiles['src/db/index.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Defaults to page=1 and pageSize=20 when params missing.',
      'Uses LIMIT/OFFSET and preserves DESC ordering.',
    ],
    customWeights: {
      context_utilization: 0.3,
      correctness: 0.2,
      completeness: 0.15,
      style_adherence: 0.15,
      edge_case_handling: 0.1,
      explanation_quality: 0.1,
    },
  },
  {
    id: 'fix-date-range-off-by-one',
    title: 'Fix Off-by-One in Date Range Filter',
    category: 'bugfix',
    difficulty: 'easy',
    productQuestion: 'Can the agent explain the root cause, not just patch it?',
    prompt:
      'Investigate the date range filter and fix the off-by-one behavior. Return a patch and explain the root cause clearly.',
    expectedBehavior:
      'Identifies the boundary bug and fixes it without altering API shape. Explanation pinpoints the root cause.',
    contextFiles: [fixtureFiles['src/utils/dateRange.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'End date inclusive works as expected without +/- 1ms hacks.',
      'Explanation describes the boundary error clearly.',
    ],
    customWeights: {
      explanation_quality: 0.3,
      correctness: 0.25,
      completeness: 0.15,
      style_adherence: 0.1,
      context_utilization: 0.1,
      edge_case_handling: 0.1,
    },
  },
  {
    id: 'refactor-callbacks-async',
    title: 'Refactor Callbacks to Async/Await',
    category: 'refactor',
    difficulty: 'medium',
    productQuestion:
      'Does the refactored code match the repo\'s existing async patterns, or does the agent impose its own style?',
    prompt:
      'Refactor the reporting functions from callbacks to async/await while keeping the calling contract similar. Return a patch and a concise explanation.',
    expectedBehavior:
      'Uses async/await consistent with repo style, avoids changing public behavior beyond necessary.',
    contextFiles: [fixtureFiles['src/services/reporting.ts'], fixtureFiles['src/db/index.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Async/await usage is consistent with codebase style.',
      'No functional regressions in query logic.',
    ],
    customWeights: {
      style_adherence: 0.3,
      correctness: 0.2,
      completeness: 0.15,
      context_utilization: 0.15,
      explanation_quality: 0.1,
      edge_case_handling: 0.1,
    },
  },
  {
    id: 'tests-auth-middleware',
    title: 'Write Tests for Auth Middleware',
    category: 'test-writing',
    difficulty: 'medium',
    productQuestion:
      'Does the agent think about what could go wrong, or only test the happy path?',
    prompt:
      'Add tests for auth middleware covering edge cases. Return a patch and a brief explanation of coverage.',
    expectedBehavior:
      'Adds tests for invalid token formats and missing headers. Avoids redundant tests.',
    contextFiles: [fixtureFiles['src/middleware/auth.ts'], fixtureFiles['tests/auth.middleware.test.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Covers missing token, invalid token format, empty Bearer token.',
      'Maintains existing test style.',
    ],
    customWeights: {
      edge_case_handling: 0.3,
      correctness: 0.2,
      completeness: 0.15,
      context_utilization: 0.15,
      explanation_quality: 0.1,
      style_adherence: 0.1,
    },
  },
  {
    id: 'review-caching-layer-pr',
    title: 'Review Caching Layer PR',
    category: 'code-review',
    difficulty: 'hard',
    productQuestion:
      'Can the agent prioritize — does it find the cache invalidation bug before nitpicking formatting?',
    prompt:
      'Review the following PR diff. Identify the most critical issue(s) first. Provide a structured review with severity and reasoning.\n\nPR diff:\n```diff\n- export function invalidateUserCache(userId: string) {\n-   invalidateCache(`user:${userId}:`);\n- }\n+ export function invalidateUserCache(userId: string) {\n+   invalidateCache(`user:${userId}`);\n+ }\n\n- export function invalidatePostsCache() {\n-   invalidateCache(\'posts:\');\n- }\n+ export function invalidatePostsCache() {\n+   invalidateCache(\'post:\');\n+ }\n```',
    expectedBehavior:
      'Flags invalidation prefix regression as critical, before minor formatting or style issues.',
    contextFiles: [fixtureFiles['src/cache/cache.ts'], fixtureFiles['src/cache/invalidation.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Identifies wrong cache prefix as critical functional regression.',
      'Prioritizes logic issues over styling.',
    ],
    customWeights: {
      completeness: 0.3,
      explanation_quality: 0.2,
      correctness: 0.2,
      context_utilization: 0.15,
      edge_case_handling: 0.1,
      style_adherence: 0.05,
    },
  },
  {
    id: 'add-types-untyped-module',
    title: 'Add TypeScript Types to Untyped Module',
    category: 'refactor',
    difficulty: 'medium',
    productQuestion:
      'Can the agent infer types from cross-file usage patterns?',
    prompt:
      'Add TypeScript types for the legacy analytics module so that TS consumers get proper typings. Keep the JS file intact. Return a patch and explanation.',
    expectedBehavior:
      'Introduces a .d.ts or wrapper types based on actual usage and fields.',
    contextFiles: [fixtureFiles['src/legacy/analytics.js'], fixtureFiles['src/services/analytics.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Type signatures match actual runtime behavior.',
      'No breaking change to legacy JS module.',
    ],
    customWeights: {
      context_utilization: 0.35,
      style_adherence: 0.15,
      correctness: 0.15,
      completeness: 0.15,
      explanation_quality: 0.1,
      edge_case_handling: 0.1,
    },
  },
  {
    id: 'retry-backoff',
    title: 'Implement Retry with Exponential Backoff',
    category: 'greenfield',
    difficulty: 'medium',
    productQuestion:
      'Does the agent handle the gnarly edge cases (jitter, non-retryable errors, max attempts)?',
    prompt:
      'Enhance the retry utility to use exponential backoff with jitter, honor max attempts, and allow marking errors as non-retryable. Return a patch and a short explanation.',
    expectedBehavior:
      'Adds configurable backoff, jitter, and early exit for non-retryable errors.',
    contextFiles: [fixtureFiles['src/utils/retry.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Backoff increases per attempt with jitter.',
      'Non-retryable errors short-circuit.',
    ],
    customWeights: {
      edge_case_handling: 0.3,
      style_adherence: 0.2,
      correctness: 0.2,
      completeness: 0.15,
      context_utilization: 0.1,
      explanation_quality: 0.05,
    },
  },
  {
    id: 'debug-websocket-memory-leak',
    title: 'Debug Memory Leak in WebSocket Handler',
    category: 'bugfix',
    difficulty: 'hard',
    productQuestion:
      'Can the agent explain a complex systems-level bug clearly?',
    prompt:
      'Investigate the WebSocket handler memory leak and fix it. Return a patch and explain the root cause and fix.',
    expectedBehavior:
      'Removes event listeners properly and prevents unbounded growth.',
    contextFiles: [fixtureFiles['src/websocket/handler.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Handlers are removed on socket close.',
      'No unbounded growth in EventEmitter listeners.',
    ],
    customWeights: {
      explanation_quality: 0.35,
      correctness: 0.2,
      completeness: 0.15,
      context_utilization: 0.1,
      edge_case_handling: 0.1,
      style_adherence: 0.1,
    },
  },
  {
    id: 'add-dark-mode',
    title: 'Add Dark Mode to Component Library',
    category: 'multi-file',
    difficulty: 'hard',
    productQuestion:
      'Can the agent make consistent changes across multiple files using the existing theme system?',
    prompt:
      'Add dark mode to the theme system and update components to support it. Use the existing theme tokens. Return a patch and explanation.',
    expectedBehavior:
      'Adds dark theme tokens and updates components to use them consistently.',
    contextFiles: [fixtureFiles['src/theme/tokens.ts'], fixtureFiles['src/components/Button.tsx'], fixtureFiles['src/components/Card.tsx']],
    rubrics: baseRubrics(),
    testCases: [
      'Adds dark theme tokens without breaking light mode.',
      'Components read from theme rather than hard-coded values.',
    ],
    customWeights: {
      context_utilization: 0.3,
      style_adherence: 0.2,
      correctness: 0.15,
      completeness: 0.15,
      edge_case_handling: 0.1,
      explanation_quality: 0.1,
    },
  },
  {
    id: 'optimize-db-query',
    title: 'Optimize Slow Database Query',
    category: 'performance',
    difficulty: 'hard',
    productQuestion:
      'Does the agent investigate before prescribing a solution?',
    prompt:
      'Optimize the slow orders query. Avoid N+1 and keep output shape the same. Return a patch and explain the performance issue and fix.',
    expectedBehavior:
      'Reduces query count and preserves output shape.',
    contextFiles: [fixtureFiles['src/db/orders.ts'], fixtureFiles['src/db/index.ts']],
    rubrics: baseRubrics(),
    testCases: [
      'Avoids per-order customer query.',
      'Maintains ordering and output shape.',
    ],
    customWeights: {
      completeness: 0.3,
      context_utilization: 0.2,
      correctness: 0.2,
      explanation_quality: 0.1,
      edge_case_handling: 0.1,
      style_adherence: 0.1,
    },
  },
];

export const AGENT_TASK_MAP: Record<string, AgentTask> = AGENT_TASKS.reduce(
  (acc, task) => {
    acc[task.id] = task;
    return acc;
  },
  {} as Record<string, AgentTask>
);

export function getAgentTask(id: string): AgentTask | undefined {
  return AGENT_TASK_MAP[id];
}
