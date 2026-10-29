import fs from 'node:fs';
import { readWork, writeWork } from '@/lib/backup';
import * as schema from '@/lib/db/schema';
import { openDb, where } from './env.mts';

/* npm run text:import -- <id> — puts a text fetched by tools/ingest-text.py
   (site/.data/ingest/<id>.json) into the work <id>: the text in its language,
   its source fields, rights public-domain. The version before is kept in the
   work's history (restorable at /admin). The site shows it after the next
   save in /admin or the next deploy (scripts cannot refresh the site's cache;
   saving the work once in /admin does). */

const id = process.argv[2];
if (!id) { console.error('Usage: npm run text:import -- <work id>'); process.exit(1); }
const file = `.data/ingest/${id}.json`;
const data = JSON.parse(fs.readFileSync(file, 'utf8')) as {
  lang: string; append: boolean; body: string; fields: Record<string, string>;
};
const { db, pool } = openDb();
try {
  const before = await readWork(db, id);
  if (!before) throw new Error(`No work “${id}” in ${where()}: add it at /admin first.`);
  const old = before.texts.find((t) => t.lang === data.lang)?.body ?? '';
  const body = data.append && old.trim() ? `${old.trimEnd()}\n\n${data.body}` : data.body;
  const f = data.fields;
  const join = (prev: string, next: string) => (data.append && prev && next && !prev.includes(next) ? `${prev}; ${next}` : next || prev);
  await db.transaction(async (tx) => {
    await tx.insert(schema.revisions).values({ workId: id, action: 'update', title: before.title, snapshot: before, createdBy: 'text:import' });
    await writeWork(tx, {
      ...before,
      rights: 'public-domain',
      sourceEdition: f.sourceEdition || before.sourceEdition,
      sourceUrl: join(before.sourceUrl, f.sourceUrl ?? ''),
      sourceRevision: join(before.sourceRevision, f.sourceRevision ?? ''),
      sourceLicence: f.sourceLicence || before.sourceLicence,
      updatedBy: 'text:import',
      createdAt: before.createdAt,
      updatedAt: undefined,
      texts: [{ lang: data.lang, body }],
    }, { replaceTexts: false });
  });
  console.log(`“${before.title}”: ${data.lang} text ${data.append ? 'extended' : 'written'} in ${where()}. Save the work once at /admin to refresh the site.`);
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
