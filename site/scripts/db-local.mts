import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

/* npm run db:local — a Postgres for development without Neon: PGlite (Postgres
   in WebAssembly) kept in site/.data/pglite and served on 127.0.0.1:5488, so
   the site and the scripts talk to it like to any Postgres. Point them at it:
     DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5488/postgres
   (in the shell, which wins over site/.env.local). Then npm run db:migrate and
   npm run db:import as usual. Stop it with Ctrl+C. */
const dir = process.env.PGLITE_DIR || '.data/pglite';
const port = Number(process.env.PGLITE_PORT || 5488);
fs.mkdirSync(dir, { recursive: true });
const db = await PGlite.create(dir);
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 20 });
await server.start();
console.log(`Local database (${dir}) on postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
const stop = async () => { await server.stop(); await db.close(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
