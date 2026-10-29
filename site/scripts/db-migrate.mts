import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { openDb, where } from './env.mts';

/* npm run db:migrate — applies the SQL files in db/migrations that have not
   run yet (drizzle keeps the list in drizzle.__drizzle_migrations). Safe to run
   any number of times. */
const { db, pool } = openDb();
console.log(`Migrating ${where()}…`);
await migrate(db, { migrationsFolder: 'db/migrations' });
console.log('Up to date.');
await pool.end();
