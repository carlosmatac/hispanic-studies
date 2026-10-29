import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/* One connection pool per server process (kept on globalThis so hot reloads in
   `next dev` don't open new ones). DATABASE_URL is Neon's pooled address on
   Vercel and in site/.env.local; locally it may point at the PGlite server
   (`npm run db:local`, docs/cms.md). Without it, nothing that reads the
   archive can work: say so plainly instead of failing somewhere deeper. */

export type DB = NodePgDatabase<typeof schema>;

const g = globalThis as unknown as { __ihsPool?: Pool; __ihsDb?: DB };

export function databaseUrl(kind: 'pooled' | 'direct' = 'pooled'): string {
  const url = (kind === 'direct' && process.env.DATABASE_URL_UNPOOLED) || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. The archive lives in a Postgres database: put the Neon variables in site/.env.local ' +
      '(`vercel env pull`), or run a local one with `npm run db:local` (docs/cms.md).',
    );
  }
  return url;
}

export function makePool(url: string, max = 3) {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  // TLS is set below (verify-full); drop sslmode so pg does not warn about its meaning changing
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  const pool = new Pool({
    connectionString: u.toString(),
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    // Neon needs TLS; the local PGlite server has none
    ssl: local ? false : { rejectUnauthorized: true },
  });
  // a dropped idle connection (Neon scales to zero) must not crash the server
  pool.on('error', (e) => console.warn('[db] idle connection closed:', e.message));
  return pool;
}

export function getDb(): DB {
  if (!g.__ihsDb) {
    g.__ihsPool = makePool(databaseUrl('pooled'));
    g.__ihsDb = drizzle({ client: g.__ihsPool, schema });
  }
  return g.__ihsDb;
}

export { schema };
