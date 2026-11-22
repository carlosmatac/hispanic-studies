'use server';

import { cookies, draftMode, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, count, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { readWork, writeWork, type BackupEdition, type BackupWork, type StoredWork } from '@/lib/backup';
import { RIGHTS, LANGUAGES } from '@/lib/canon';
import { EXTENTS, hostingProblems } from '@/lib/editions';
import type { AdminDict } from '@/lib/i18n';
import { SWATCHES } from '@/lib/palette';
import { isLang } from '@/lib/i18n';
import { countWords, readingMinutes } from '@/lib/text';
import { dummyHash, hashPassword, PASSWORD_MIN, verifyPassword } from '@/lib/admin/password';
import { clearSessionCookie, requireSession, setSessionCookie } from '@/lib/admin/session';
import { adminText, LANG_COOKIE } from '@/lib/admin/lang';
import { refreshSite } from '@/lib/admin/revalidate';
import { applyArticleStatus, pruneRevisions as pruneHistory } from '@/lib/admin/article-status';
import { ID_PATTERN, slug, type CuratedPayload, type FormState, type SaveResult, type WorkPayload } from '@/lib/admin/types';

/* Everything the back office changes goes through here. Every action but the
   sign-in checks the session first (requireSession); every change to the
   archive refreshes the site (lib/admin/revalidate.ts). */

const WINDOW_MIN = 15;
const MAX_PER_USER = 5;
const MAX_PER_ADDRESS = 30;

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

const pruneRevisions = (workId: string) => pruneHistory(getDb(), workId);

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

  // the curated 80 (issue #93): only for a work that is, or was, one of them
  const textLangsAfter = new Set((before?.texts ?? []).map((x) => x.lang));
  for (const x of p.texts) { if (x.body.trim()) textLangsAfter.add(x.lang); else textLangsAfter.delete(x.lang); }
  const curatedPart = p.c && (p.c.curated || before?.canonId || before?.curated)
    ? await curatedRecord(id, p.c, before, textLangsAfter, fields, t, me.username, p.status, title, clean(p.author))
    : null;
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
    await writeWork(tx, { ...record, ...(curatedPart ?? {}), references, texts: p.texts.map((x) => ({ lang: x.lang, body: x.body.trim() ? x.body : null })) }, { replaceTexts: false });
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
  const keys = ['titleEn', 'titleEs', 'introEn', 'introEs', 'notesEn', 'notesEs', 'doorEn', 'doorEs', 'landingTitleEn', 'landingTitleEs', 'landingIntroEn', 'landingIntroEs'] as const;
  const values = Object.fromEntries(keys.map((k) => [k, clean(form.get(k))])) as Record<(typeof keys)[number], string>;
  await getDb().insert(schema.archivePage).values({ id: 1, ...values, updatedBy: me.username })
    .onConflictDoUpdate({ target: schema.archivePage.id, set: { ...values, updatedBy: me.username, updatedAt: new Date() } });
  refreshSite();
  return { ok: true, message: t.common.saved };
}

/* ---------------- the curated 80 (issue #93) ---------------- */

const ENGLISH_STATES = ['known_edition', 'not_found', 'partial_only', 'suppressed_by_editor'];
const DATE_KINDS = ['publication', 'composition', 'delivery', 'enactment', 'manuscript', 'signature', 'document_date'];
const SCOPES = ['work', 'document', 'paired_documents', 'bounded_section', 'chapter'];
const RENDER = ['external_link', 'bibliographic_link', 'inline_html', 'local_pdf'];
const PLANS = ['external_link', 'html_candidate', 'pdf_candidate', 'reference_only'];

/**
 * The curated-80 part of a saved work: checked, and shaped for writeWork. Marks
 * what is wrong in `fields`. Hosting an edition is refused unless its approval
 * passes every check of lib/editions.ts (U.S. law), and an HTML edition needs
 * the text in its language. The article's review state decides the record's:
 * published together; back in review, a work new with the 80 goes back to draft
 * (one that was public before keeps its old record).
 */
async function curatedRecord(
  id: string, c: CuratedPayload, before: StoredWork | null, textLangs: Set<string>, fields: Record<string, string>,
  T: AdminDict, user: string, status: 'draft' | 'published', title: string, author: string,
): Promise<Partial<BackupWork>> {
  const db = getDb();
  const t = T.w80;
  const order = clean(c.curatedOrder);
  const orderNum = order ? Number(order) : null;
  if (c.curated) {
    const [era] = c.eraId ? await db.select({ id: schema.eras.id }).from(schema.eras).where(eq(schema.eras.id, c.eraId)) : [];
    if (!era) fields['c.eraId'] = T.work.fieldRequired;
    if (orderNum == null || !Number.isInteger(orderNum) || orderNum < 1 || orderNum > 999) fields['c.curatedOrder'] = t.orderBad;
  }
  // Beltrán's number and address never change once set: links and the import rely on them
  const canonId = before?.canonId ?? (clean(c.canonId) || null);
  const slugValue = before?.slug ?? (clean(c.slug).toLowerCase() || null);
  if (slugValue && !before?.slug) {
    if (!ID_PATTERN.test(slugValue)) fields['c.slug'] = t.slugTaken;
    const [other] = await db.select({ id: schema.works.id }).from(schema.works)
      .where(and(sql`${schema.works.id} <> ${id}`, sql`(${schema.works.slug} = ${slugValue} or ${schema.works.id} = ${slugValue})`));
    if (other) fields['c.slug'] = t.slugTaken;
  }
  if (canonId && !before?.canonId) {
    const [other] = await db.select({ id: schema.works.id }).from(schema.works).where(and(eq(schema.works.canonId, canonId), sql`${schema.works.id} <> ${id}`));
    if (other) fields['c.canonId'] = t.canonTaken;
  }
  const editions: BackupEdition[] = c.editions.map((e, i) => {
    const url = clean(e.url);
    if (!okUrl(url)) fields[`ed.${i}.url`] = T.work.badUrl;
    const year = clean(e.publicationYear);
    if (year && Number.isNaN(yearOf(year))) fields[`ed.${i}.year`] = T.work.badYear;
    const row: BackupEdition = {
      id: clean(e.id) || `${id}-e${Math.random().toString(36).slice(2, 8)}`,
      position: i,
      readingLang: ['es', 'pt', 'en'].includes(e.readingLang) ? e.readingLang : '',
      primary: !!e.primary,
      languages: e.languages.split(/[,\s]+/).map((l) => l.trim().toLowerCase()).filter(Boolean),
      extent: (EXTENTS as readonly string[]).includes(e.extent) ? e.extent : 'edition_record',
      url,
      label: clean(e.label), sourceName: clean(e.sourceName), translator: clean(e.translator), scopeNote: clean(e.scopeNote), citation: clean(e.citation),
      publicationYear: year && !Number.isNaN(yearOf(year)) ? yearOf(year) : null,
      scopeCheck: clean(e.scopeCheck),
      deliveryPlan: PLANS.includes(e.deliveryPlan) ? e.deliveryPlan : 'external_link',
      usHostingBasis: clean(e.usHostingBasis),
      renderMode: (RENDER.includes(e.renderMode) ? e.renderMode : 'external_link') as BackupEdition['renderMode'],
      rightsApproved: !!e.rightsApproved, rightsBasis: clean(e.rightsBasis), rightsEvidence: clean(e.rightsEvidence), completeSpan: clean(e.completeSpan),
      approvedBy: clean(e.approvedBy), approvedOn: clean(e.approvedOn), pdfUrl: clean(e.pdfUrl),
    };
    const problems = hostingProblems(row).map((k) => t.hostProblems[k]);
    if (row.renderMode === 'inline_html' && !textLangs.has(row.readingLang)) problems.push(t.hostProblems.text);
    if (problems.length) fields[`ed.${i}.host`] = problems.join(' ');
    return row;
  });
  const articles = c.articles
    .filter((a) => a.locale === 'es' || a.locale === 'en')
    .map((a) => ({ locale: a.locale, title: clean(a.title), aboutAuthor: String(a.aboutAuthor ?? '').trim(), workInItsTime: String(a.workInItsTime ?? '').trim(), whyReadToday: String(a.whyReadToday ?? '').trim() }));
  const legacy = before?.legacyRecord ?? false;
  const publish = c.curated && c.articleStatus === 'published';
  const wasPublished = before?.articleStatus === 'published';
  return {
    canonId, slug: slugValue, curated: !!c.curated, curatedOrder: orderNum, eraId: c.eraId || before?.eraId || null,
    originalTitle: clean(c.originalTitle) || title, creator: clean(c.creator) || author, dateDisplay: clean(c.dateDisplay),
    dateKind: DATE_KINDS.includes(c.dateKind) ? c.dateKind : '', scope: SCOPES.includes(c.scope) ? c.scope : '',
    originalLanguages: c.originalLanguages.filter((l) => LANGUAGES.some((x) => x.id === l)),
    browseRegionIds: c.browseRegionIds, geographicNote: clean(c.geographicNote),
    englishState: ENGLISH_STATES.includes(c.englishState) ? c.englishState : '', editionNotes: String(c.editionNotes ?? '').trim(),
    companions: c.companions.map((x) => ({ title: clean(x.title), url: clean(x.url), note: clean(x.note), relationship: clean(x.relationship) || 'separate_work' })).filter((x) => x.title || x.url),
    articleStatus: publish ? 'published' : 'review',
    legacyRecord: legacy,
    ...(publish && !wasPublished ? { reviewedBy: user, reviewedAt: new Date().toISOString() } : {}),
    // the record follows the article (see above); outside the 80 it keeps its own state
    ...(c.curated ? { status: publish ? 'published' as const : legacy ? status : 'draft' as const } : {}),
    articles,
    editions,
  };
}

/**
 * Approve and publish (or send back to review) curated works: one, or every one
 * still in review in an era. Each change keeps the version before in the work's
 * history. Publishing shows the article and the record; back in review, a work
 * new with the 80 returns to draft, one that was public before keeps its record.
 */
export async function setArticleStatus(ids: string[], to: 'published' | 'review') {
  const me = await requireSession();
  // the change itself is shared with `npm run curated:publish` (lib/admin/article-status.ts)
  const changed = await applyArticleStatus(getDb(), ids, to, me.username);
  if (changed.length) refreshSite();
  return { ok: true, n: changed.length };
}

/** Approve and publish every work of an era that is still in review. */
export async function approveEra(eraId: string) {
  await requireSession();
  const rows = await getDb().select({ id: schema.works.id }).from(schema.works)
    .where(and(eq(schema.works.eraId, eraId), eq(schema.works.curated, true), eq(schema.works.articleStatus, 'review')));
  return setArticleStatus(rows.map((r) => r.id), 'published');
}

/** Rename an era (its order and works come from Beltrán's list). */
export async function saveEra(_: FormState, form: FormData): Promise<FormState> {
  await requireSession();
  const { t } = await adminText();
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
  await getDb().update(schema.eras).set({ nameEn, nameEs, yearFrom, yearTo, updatedAt: new Date() }).where(eq(schema.eras.id, id));
  refreshSite();
  return { ok: true, message: t.common.saved };
}
