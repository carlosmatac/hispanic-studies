import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

/* drizzle-kit writes the SQL migrations from lib/db/schema.ts into db/migrations
   (`npm run db:generate`); `npm run db:migrate` (scripts/db-migrate.ts) applies them. */
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '' },
});
