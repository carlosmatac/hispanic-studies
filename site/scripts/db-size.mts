import { sql } from 'drizzle-orm';
import { openDb, where } from './env.mts';

/* npm run db:size — how much room the archive takes (for the capacity
   estimate in docs/cms.md): the database, each table (with its indexes and
   TOAST), and the average work. */
const { db, pool } = openDb();
console.log(`Measuring ${where()}…\n`);
const q = async <T,>(s: ReturnType<typeof sql>) => (await db.execute(s)).rows as T[];
const [dbs] = await q<{ size: string; bytes: string }>(sql`select pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes`);
console.log(`database: ${dbs.size} (${dbs.bytes} bytes)`);
const tables = await q<{ name: string; total: string; bytes: string; rows: string }>(sql`
  select c.relname as name, pg_size_pretty(pg_total_relation_size(c.oid)) as total, pg_total_relation_size(c.oid) as bytes, c.reltuples::bigint as rows
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' order by pg_total_relation_size(c.oid) desc`);
for (const t of tables) console.log(`  ${t.name.padEnd(16)} ${t.total.padStart(9)}  (${t.bytes} bytes)`);
const [w] = await q<{ works: string; with_text: string; text_bytes: string; text_stored: string; record_bytes: string }>(sql`
  select (select count(*) from works) as works,
         (select count(distinct work_id) from work_texts) as with_text,
         (select coalesce(sum(octet_length(body)), 0) from work_texts) as text_bytes,
         (select coalesce(sum(pg_column_size(body)), 0) from work_texts) as text_stored,
         (select coalesce(sum(pg_column_size(w.*)), 0) from works w) as record_bytes`);
console.log(`\nworks: ${w.works}, with a text: ${w.with_text}`);
console.log(`records: ${w.record_bytes} bytes stored, ${Math.round(+w.record_bytes / Math.max(1, +w.works))} per work`);
console.log(`texts: ${w.text_bytes} bytes of Markdown, ${w.text_stored} stored (compressed), ${Math.round(+w.text_stored / Math.max(1, +w.with_text))} per text`);
await pool.end();
