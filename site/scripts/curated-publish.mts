import { and, asc, eq, inArray } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { applyArticleStatus } from '@/lib/admin/article-status';
import { openDb, where } from './env.mts';

/* npm run curated:publish -- --as <name> [--era era-01 …] [--apply]
   Approve and publish the works of the curated 80 still in review, as the
   button "Aprobar y publicar los N en revisión" at /admin/curated does, era by
   era, through the same code (lib/admin/article-status.ts): each work's version
   before goes into its history, the article and the record become public.
   Editions and their approvals to be hosted are never touched.
   Without --apply it only lists what it would do. `--as` is the name kept as
   the reviewer in the history (not a password; it need not be an account).
   Afterwards, the deployed site shows it once its cache is refreshed: any save
   at /admin, or the next deploy. */

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const as = opt('--as');
const eras = args.flatMap((a, i) => (args[i - 1] === '--era' ? [a] : []));
const apply = args.includes('--apply');
if (!as) {
  console.error('Say who approves it: npm run curated:publish -- --as <name> [--era era-01] [--apply]');
  process.exit(1);
}

const { db, pool } = openDb();
console.log(`${apply ? 'Publishing in' : 'Dry run against'} ${where()}…`);
const rows = await db.select({ id: schema.works.id, title: schema.works.title, eraId: schema.works.eraId, articleStatus: schema.works.articleStatus, status: schema.works.status })
  .from(schema.works)
  .where(and(eq(schema.works.curated, true), eq(schema.works.articleStatus, 'review'), ...(eras.length ? [inArray(schema.works.eraId, eras)] : [])))
  .orderBy(asc(schema.works.eraId), asc(schema.works.curatedOrder));

const byEra = new Map<string, typeof rows>();
for (const r of rows) byEra.set(r.eraId ?? '—', [...(byEra.get(r.eraId ?? '—') ?? []), r]);
let total = 0;
for (const [era, list] of byEra) {
  console.log(`\n${era}: ${list.length} in review`);
  for (const r of list) console.log(`  ${r.id.padEnd(34)} record ${r.status.padEnd(9)} ${r.title}`);
  if (apply) {
    const changed = await applyArticleStatus(db, list.map((r) => r.id), 'published', as);
    console.log(`  → ${changed.length} published`);
    total += changed.length;
  }
}
console.log(apply ? `\n${total} works published.` : `\n${rows.length} works would be published. Run again with --apply.`);
await pool.end();
