import fs from 'node:fs';
import { exportArchive } from '@/lib/backup';
import { openDb, where } from './env.mts';

/* npm run db:export [-- file.json] — the whole archive as JSON (the same file as
   the "Download backup" button in /admin). Default: backups/archive-<date>.json */
const { db, pool } = openDb();
const file = process.argv[2] || `backups/archive-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
console.log(`Exporting ${where()}…`);
const data = await exportArchive(db);
fs.mkdirSync(file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '.', { recursive: true });
fs.writeFileSync(file, JSON.stringify(data, null, 1));
console.log(`${data.works.length} works, ${data.sections.length} sections, ${data.regions.length} regions → ${file}`);
await pool.end();
