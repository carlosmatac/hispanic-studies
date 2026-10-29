'use server';

import { cookies, draftMode, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, count, desc, eq, gt, inArray, lt, notInArray, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { readWork, writeWork, type BackupWork } from '@/lib/backup';
import { RIGHTS, LANGUAGES } from '@/lib/canon';
import { SWATCHES } from '@/lib/palette';
import { isLang } from '@/lib/i18n';
import { countWords, readingMinutes } from '@/lib/text';
import { dummyHash, hashPassword, PASSWORD_MIN, verifyPassword } from '@/lib/admin/password';
import { clearSessionCookie, requireSession, setSessionCookie } from '@/lib/admin/session';
import { adminText, LANG_COOKIE } from '@/lib/admin/lang';
import { refreshSite } from '@/lib/admin/revalidate';
import { ID_PATTERN, slug, type FormState, type SaveResult, type WorkPayload } from '@/lib/admin/types';

/* Everything the back office changes goes through here. Every action but the
   sign-in checks the session first (requireSession); every change to the
   archive refreshes the site (lib/admin/revalidate.ts). */

const WINDOW_MIN = 15;
const MAX_PER_USER = 5;
const MAX_PER_ADDRESS = 30;
const KEEP_REVISIONS = 50;

/* ---------------- signing in and out ---------------- */

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await adminText();
  const username = String(form.get('username') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const values = { username };
  if (!username || !password) return { message: t.signIn.missing, values };

  const db = getDb();
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  const keys = [`u:${username}`, `ip:${ip}`];
  const since = sql`now() - make_interval(mins => ${WINDOW_MIN})`;
  await db.delete(schema.loginAttempts).where(lt(schema.loginAttempts.at, sql`now() - interval '1 day'`));
  const recent = await db.select({ key: schema.loginAttempts.key, n: count() }).from(schema.loginAttempts)
    .where(and(inArray(schema.loginAttempts.key, keys), gt(schema.loginAttempts.at, since))).groupBy(schema.loginAttempts.key);
  const tries = (k: string) => recent.find((r) => r.key === k)?.n ?? 0;
  if (tries(keys[0]) >= MAX_PER_USER || tries(keys[1]) >= MAX_PER_ADDRESS) return { message: t.signIn.tooMany, values };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) {
    await db.insert(schema.loginAttempts).values(keys.map((key) => ({ key })));
    return { message: t.signIn.wrong, values };
  }
  await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.key, keys[0]));
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await setSessionCookie(user);
  // Draft Mode lets the signed-in editor see drafts on the site itself
  (await draftMode()).enable();
  const next = String(form.get('next') ?? '');
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin');
}

export async function logout() {
  await clearSessionCookie();
  (await draftMode()).disable();
  redirect('/admin/login');
}

export async function setAdminLang(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireSession();
  const { t } = await adminText();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const again = String(form.get('again') ?? '');
  const db = getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { message: t.account.wrong, fields: { current: t.account.wrong } };
  if (next.length < PASSWORD_MIN) return { message: t.account.short(PASSWORD_MIN), fields: { next: t.account.short(PASSWORD_MIN) } };
  if (next !== again) return { message: t.account.differ, fields: { again: t.account.differ } };
  const [updated] = await db.update(schema.users)
    .set({ passwordHash: await hashPassword(next), sessionVersion: user.sessionVersion + 1, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id)).returning();
  await setSessionCookie(updated);
  return { ok: true, message: t.account.changed };
}

/* ---------------- works ---------------- */

const yearOf = (s: string) => (/^-?\d{1,4}$/.test(s.trim()) ? Number(s.trim()) : NaN);
const okUrl = (s: string) => !s.trim() || /^https?:\/\/\S+$/i.test(s.trim());
const clean = (s: unknown) => String(s ?? '').trim();

async function pruneRevisions(workId: string) {
  const db = getDb();
  const keep = db.select({ id: schema.revisions.id }).from(schema.revisions)
    .where(eq(schema.revisions.workId, workId)).orderBy(desc(schema.revisions.createdAt)).limit(KEEP_REVISIONS);
  await db.delete(schema.revisions).where(and(eq(schema.revisions.workId, workId), notInArray(schema.revisions.id, keep)));
}

export async function saveWork(p: WorkPayload): Promise<SaveResult> {
  const me = await requireSession();
  const { t } = await adminText();
  const w = t.work;
  const db = getDb();
  const fields: Record<string, string> = {};

  const id = clean(p.id);
  const title = clean(p.title);
  const year = yearOf(p.year);
  if (!title) fields.title = w.fieldRequired;
  if (Number.isNaN(year)) fields.year = w.badYear;
  if (!ID_PATTERN.test(id)) fields.id = w.idBad;
  for (const k of ['pdSpainYear', 'pdUsYear'] as const) if (clean(p[k]) && Number.isNaN(yearOf(p[k]))) fields[k] = w.badYear;
  if (!okUrl(p.sourceUrl)) fields.sourceUrl = w.badUrl;
  p.links.forEach((l, i) => { if (!/^https?:\/\/\S+$/i.test(clean(l.url))) fields[`links.${i}`] = w.badUrl; });
  p.references.forEach((r, i) => { if (!okUrl(r.url)) fields[`references.${i}.url`] = w.badUrl; });
  if (!(RIGHTS as readonly string[]).includes(p.rights)) fields.rights = w.fieldRequired;
  if (!LANGUAGES.some((l) => l.id === p.language)) fields.language = w.fieldRequired;
  const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, p.sectionId));
  if (!section) fields.sectionId = w.fieldRequired;
  const [region] = await db.select().from(schema.regions).where(eq(schema.regions.id, p.regionId));
  if (!region) fields.regionId = w.fieldRequired;
  const textLangs = new Set(['es', 'en', p.language]);
  if (p.texts.some((x) => !textLangs.has(x.lang))) return { ok: false, message: t.common.error };

  const before = await readWork(db, id);
  if (p.isNew && before) fields.id = w.idTaken;
  if (!p.isNew && !before) return { ok: false, message: t.common.error };
  if (Object.keys(fields).length) return { ok: false, message: w.errors, fields };

  const record: Omit<BackupWork, 'texts' | 'references' | 'createdAt' | 'updatedAt'> = {
    id,
    status: p.status === 'published' ? 'published' : 'draft',
    title,
    author: clean(p.author), fullName: clean(p.fullName), life: clean(p.life), year,
    sectionId: p.sectionId, regionId: p.regionId, place: clean(p.place), code: clean(p.code).toUpperCase(), language: p.language,
    rights: p.rights,
    pdSpainYear: clean(p.pdSpainYear) ? yearOf(p.pdSpainYear) : null,
    pdUsYear: clean(p.pdUsYear) ? yearOf(p.pdUsYear) : null,
    needsTranscription: !!p.needsTranscription, counter: !!p.counter,
    camp: clean(p.camp), stance: clean(p.stance), buenoCode: clean(p.buenoCode), buenoName: clean(p.buenoName),
    noteEn: clean(p.noteEn), noteEs: clean(p.noteEs), summaryEn: clean(p.summaryEn), summaryEs: clean(p.summaryEs),
    sourceEdition: clean(p.sourceEdition), sourceUrl: clean(p.sourceUrl), sourceRevision: clean(p.sourceRevision), sourceLicence: clean(p.sourceLicence),
    links: p.links.map((l) => ({ label: clean(l.label), url: clean(l.url) })).filter((l) => l.url),
    updatedBy: me.username,
  };
  const references = p.references
    .map((r) => ({
      kind: (['book', 'chapter', 'article', 'web'] as const).includes(r.kind) ? r.kind : 'book' as const,
      author: clean(r.author), title: clean(r.title), container: clean(r.container), edition: clean(r.edition),
      publisher: clean(r.publisher), place: clean(r.place), year: clean(r.year), pages: clean(r.pages), url: clean(r.url),
      accessed: /^\d{4}-\d{2}-\d{2}$/.test(clean(r.accessed)) ? clean(r.accessed) : '',
    }))
    .filter((r) => r.title || r.author || r.url);

  await db.transaction(async (tx) => {
    if (before) {
      await tx.insert(schema.revisions).values({ workId: id, action: 'update', title: before.title, snapshot: before, createdBy: me.username });
    }
    await writeWork(tx, { ...record, references, texts: p.texts.map((x) => ({ lang: x.lang, body: x.body.trim() ? x.body : null })) }, { replaceTexts: false });
  });
  await pruneRevisions(id);
  refreshSite();
  const texts = await db.select({ lang: schema.workTexts.lang, words: schema.workTexts.words, minutes: schema.workTexts.minutes })
    .from(schema.workTexts).where(eq(schema.workTexts.workId, id));
  return { ok: true, id, message: t.common.saved, updatedAt: new Date().toISOString(), texts };
}

export async function deleteWork(id: string) {
  const me = await requireSession();
  const db = getDb();
  const before = await readWork(db, id);
  if (before) {
    await db.transaction(async (tx) => {
      await tx.insert(schema.revisions).values({ workId: id, action: 'delete', title: before.title, snapshot: before, createdBy: me.username });
      await tx.delete(schema.works).where(eq(schema.works.id, id));
    });
    refreshSite();
  }
  redirect('/admin?deleted=' + encodeURIComponent(id));
}

export async function restoreRevision(revisionId: number) {
  const me = await requireSession();
  const db = getDb();
  const [rev] = await db.select().from(schema.revisions).where(eq(schema.revisions.id, revisionId));
  if (!rev) redirect('/admin');
  const snap = rev.snapshot as BackupWork;
  // the section or region of an old version may be gone: then it goes in the first ones
  const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, snap.sectionId));
  const [region] = await db.select().from(schema.regions).where(eq(schema.regions.id, snap.regionId));
  const [firstSection] = section ? [section] : await db.select().from(schema.sections).orderBy(schema.sections.position).limit(1);
  const [firstRegion] = region ? [region] : await db.select().from(schema.regions).orderBy(schema.regions.position).limit(1);
  const current = await readWork(db, rev.workId);
  await db.transaction(async (tx) => {
    if (current) await tx.insert(schema.revisions).values({ workId: rev.workId, action: 'restore', title: current.title, snapshot: current, createdBy: me.username });
    await writeWork(tx, { ...snap, sectionId: firstSection.id, regionId: firstRegion.id, updatedBy: me.username, createdAt: snap.createdAt, updatedAt: undefined }, { replaceTexts: true });
  });
  await pruneRevisions(rev.workId);
  refreshSite();
  redirect(`/admin/works/${encodeURIComponent(rev.workId)}?restored=${rev.id}`);
}

/** Live word count for the editor's text (the same count the reader uses). */
export async function measureText(md: string) {
  await requireSession();
  const words = countWords(md);
  return { words, minutes: readingMinutes(words) };
}

/* ---------------- sections ---------------- */

const n = (v: FormDataEntryValue | null) => (String(v ?? '').trim() === '' ? null : Number(String(v).trim()));

export async function saveSection(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const { t } = await adminText();
  const db = getDb();
  const id = String(form.get('id') ?? '');
  const nameEn = clean(form.get('nameEn'));
  const nameEs = clean(form.get('nameEs'));
  const yearFrom = n(form.get('yearFrom'));
  const yearTo = n(form.get('yearTo'));
  const fields: Record<string, string> = {};
  if (!nameEn) fields.nameEn = t.work.fieldRequired;
  if (!nameEs) fields.nameEs = t.work.fieldRequired;
  if (yearFrom != null && Number.isNaN(yearFrom)) fields.yearFrom = t.work.badYear;
  if (yearTo != null && Number.isNaN(yearTo)) fields.yearTo = t.work.badYear;
  if (Object.keys(fields).length) return { message: t.work.errors, fields, values: { nameEn, nameEs, yearFrom: String(form.get('yearFrom') ?? ''), yearTo: String(form.get('yearTo') ?? '') } };
  if (id) {
    await db.update(schema.sections).set({ nameEn, nameEs, yearFrom, yearTo, updatedAt: new Date() }).where(eq(schema.sections.id, id));
  } else {
    const base = slug(nameEn) || 'section';
    const taken = new Set((await db.select({ id: schema.sections.id }).from(schema.sections)).map((r) => r.id));
    let newId = base;
    for (let k = 2; taken.has(newId); k++) newId = `${base}-${k}`;
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${schema.sections.position}), -1)` }).from(schema.sections);
    await db.insert(schema.sections).values({ id: newId, position: Number(max) + 1, nameEn, nameEs, yearFrom, yearTo });
  }
  refreshSite();
  return { ok: true, message: t.common.saved };
}

async function move(table: typeof schema.sections | typeof schema.regions, id: string, dir: -1 | 1) {
  const db = getDb();
  const rows = await db.select({ id: table.id, position: table.position }).from(table).orderBy(table.position);
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await db.transaction(async (tx) => {
    for (const [k, r] of rows.entries()) await tx.update(table).set({ position: k }).where(eq(table.id, r.id));
  });
  refreshSite();
}

export async function moveSection(id: string, dir: -1 | 1) {
  await requireSession();
  await move(schema.sections, id, dir);
}

export async function deleteSection(id: string): Promise<FormState> {
  await requireSession();
  const { t } = await adminText();
  const db = getDb();
  const [{ k }] = await db.select({ k: count() }).from(schema.works).where(eq(schema.works.sectionId, id));
  if (k > 0) return { message: t.sections.cantDelete(k) };
  await db.delete(schema.sections).where(eq(schema.sections.id, id));
  refreshSite();
  return { ok: true };
}

/* ---------------- regions ---------------- */

export async function saveRegion(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const { t } = await adminText();
  const db = getDb();
  const id = String(form.get('id') ?? '');
  const values = {
    nameEn: clean(form.get('nameEn')), nameEs: clean(form.get('nameEs')),
    noteEn: clean(form.get('noteEn')), noteEs: clean(form.get('noteEs')),
    swatch: String(form.get('swatch') ?? ''),
  };
  const fields: Record<string, string> = {};
  if (!values.nameEn) fields.nameEn = t.work.fieldRequired;
  if (!values.nameEs) fields.nameEs = t.work.fieldRequired;
  if (!SWATCHES.some((s) => s.id === values.swatch)) fields.swatch = t.work.fieldRequired;
  // the colour must not be another region's
  const [other] = await db.select({ id: schema.regions.id }).from(schema.regions)
    .where(and(eq(schema.regions.swatch, values.swatch), id ? sql`${schema.regions.id} <> ${id}` : sql`true`));
  if (other) fields.swatch = t.regions.taken;
  if (Object.keys(fields).length) return { message: fields.swatch === t.regions.taken ? t.regions.taken : t.work.errors, fields, values };
  try {
    if (id) {
      await db.update(schema.regions).set({ ...values, updatedAt: new Date() }).where(eq(schema.regions.id, id));
    } else {
      const base = slug(values.nameEn) || 'region';
      const taken = new Set((await db.select({ id: schema.regions.id }).from(schema.regions)).map((r) => r.id));
      let newId = base;
      for (let k = 2; taken.has(newId); k++) newId = `${base}-${k}`;
      const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${schema.regions.position}), -1)` }).from(schema.regions);
      await db.insert(schema.regions).values({ id: newId, position: Number(max) + 1, ...values });
    }
  } catch {
    // two editors picking the same colour at once: the database's unique rule catches it
    return { message: t.regions.taken, fields: { swatch: t.regions.taken }, values };
  }
  refreshSite();
  return { ok: true, message: t.common.saved };
}

export async function moveRegion(id: string, dir: -1 | 1) {
  await requireSession();
  await move(schema.regions, id, dir);
}

export async function deleteRegion(id: string): Promise<FormState> {
  await requireSession();
  const { t } = await adminText();
  const db = getDb();
  const [{ k }] = await db.select({ k: count() }).from(schema.works).where(eq(schema.works.regionId, id));
  if (k > 0) return { message: t.regions.cantDelete(k) };
  await db.delete(schema.regions).where(eq(schema.regions.id, id));
  refreshSite();
  return { ok: true };
}

/* ---------------- the archive page's own words ---------------- */

export async function savePage(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireSession();
  const { t } = await adminText();
  const keys = ['titleEn', 'titleEs', 'introEn', 'introEs', 'notesEn', 'notesEs', 'doorEn', 'doorEs'] as const;
  const values = Object.fromEntries(keys.map((k) => [k, clean(form.get(k))])) as Record<(typeof keys)[number], string>;
  await getDb().insert(schema.archivePage).values({ id: 1, ...values, updatedBy: me.username })
    .onConflictDoUpdate({ target: schema.archivePage.id, set: { ...values, updatedBy: me.username, updatedAt: new Date() } });
  refreshSite();
  return { ok: true, message: t.common.saved };
}
