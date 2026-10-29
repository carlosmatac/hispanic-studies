import nextEnv from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { databaseUrl, makePool } from '@/lib/db';
import * as schema from '@/lib/db/schema';

/* Shared by the npm scripts: the same .env files Next reads (site/.env.local
   holds Neon's variables), and a database handle on the direct (unpooled)
   address, which migrations need. Never print the address. */
nextEnv.loadEnvConfig(process.cwd());

export function openDb() {
  const pool = makePool(databaseUrl('direct'), 2);
  return { db: drizzle({ client: pool, schema }), pool };
}

export const where = () => {
  const url = databaseUrl('direct');
  return /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? 'the local database' : /neon\.tech/.test(url) ? 'the Neon database' : 'the database';
};
