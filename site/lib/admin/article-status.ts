import { and, desc, eq, notInArray } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { readWork } from '@/lib/backup';

/* Approving (or sending back to review) works of the curated 80, shared by the
   back office (setArticleStatus / approveEra in app/admin/actions.ts, which
   check the session and refresh the site) and `npm run curated:publish`.
   Touches the article's and the record's state only: editions, and their
   approvals to be hosted here, are never changed. */

/** Versions kept in a work's history. */
export const KEEP_REVISIONS = 50;

export async function pruneRevisions(db: DB, workId: string) {
  const keep = db.select({ id: schema.revisions.id }).from(schema.revisions)
    .where(eq(schema.revisions.workId, workId)).orderBy(desc(schema.revisions.createdAt)).limit(KEEP_REVISIONS);
  await db.delete(schema.revisions).where(and(eq(schema.revisions.workId, workId), notInArray(schema.revisions.id, keep)));
}

/**
 * Each change keeps the version before in the work's history. Publishing shows
 * the article and the record; back in review, a work new with the 80 returns
 * to draft, one that was public before keeps its record. Returns the ids changed.
 */
export async function applyArticleStatus(db: DB, ids: string[], to: 'published' | 'review', username: string) {
  const changed: string[] = [];
  await db.transaction(async (tx) => {
    for (const id of ids) {
      const before = await readWork(tx, id);
      if (!before || !before.curated) continue;
      if (to === 'published' && before.articleStatus === 'published' && before.status === 'published') continue;
      if (to === 'review' && before.articleStatus === 'review') continue;
      await tx.insert(schema.revisions).values({ workId: id, action: 'update', title: before.title, snapshot: before, createdBy: username });
      await tx.update(schema.works).set(to === 'published'
        ? { articleStatus: 'published', status: 'published', reviewedBy: username, reviewedAt: new Date(), updatedAt: new Date(), updatedBy: username }
        : { articleStatus: 'review', status: before.legacyRecord ? before.status : 'draft', updatedAt: new Date(), updatedBy: username })
        .where(eq(schema.works.id, id));
      changed.push(id);
    }
  });
  for (const id of changed) await pruneRevisions(db, id);
  return changed;
}
