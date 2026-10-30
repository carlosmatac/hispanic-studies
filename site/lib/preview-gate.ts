import type { Lang } from '@/lib/i18n';

/* The private preview's gate (issue #86, after #62). When SITE_PASSWORD is set,
   proxy.ts sends every visitor without a valid pass to the entry page
   (app/enter), whose form sets the pass. Without the variable the site is open.

   The pass is a cookie holding `<expiry>.<HMAC-SHA256(SITE_PASSWORD, expiry)>`:
   never the password, it cannot be forged without it, and changing
   SITE_PASSWORD on Vercel turns every pass already given into nothing. Web
   Crypto only, so it runs in the proxy and in the server action alike. This
   module must stay free of next/headers and the database. */

export const PREVIEW_COOKIE = 'ihs_preview';
export const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // thirty days, in seconds
export const ENTER_PATH = '/enter';

// the two languages, without importing every string of the site into the proxy
const isLang = (v: string): v is Lang => v === 'en' || v === 'es';

const enc = new TextEncoder();
let cached: { secret: string; key: Promise<CryptoKey> } | null = null;

function keyFor(secret: string) {
  if (cached?.secret !== secret) {
    cached = {
      secret,
      key: crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    };
  }
  return cached.key;
}

async function sign(secret: string, expiry: string) {
  const mac = await crypto.subtle.sign('HMAC', await keyFor(secret), enc.encode(`ihs-preview:v1:${expiry}`));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('');
}

// compare without leaking where the first difference is
export function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function makePass(secret: string, now = Date.now()) {
  const expiry = String(Math.floor(now / 1000) + PREVIEW_MAX_AGE);
  return `${expiry}.${await sign(secret, expiry)}`;
}

export async function checkPass(secret: string, pass: string | undefined, now = Date.now()) {
  if (!pass) return false;
  const dot = pass.indexOf('.');
  const expiry = pass.slice(0, dot);
  if (dot < 1 || !/^\d{1,12}$/.test(expiry) || Number(expiry) * 1000 < now) return false;
  return same(pass.slice(dot + 1), await sign(secret, expiry));
}

/* Where to go after entering: a path on this site only (no other host, no
   scheme, no backslashes or control characters), never the entry page itself. */
export function safeNext(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.length > 2000) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  let url: URL;
  try { url = new URL(value, 'http://site.invalid'); } catch { return null; }
  if (url.origin !== 'http://site.invalid') return null;
  if (url.pathname === ENTER_PATH || url.pathname.startsWith(`${ENTER_PATH}/`)) return null;
  return url.pathname + url.search + url.hash;
}

/* The entry page's language: the one in the path the visitor was going to
   (/es/archive/T030 → Spanish), else the browser's first preference of the two. */
export function entryLang(next: string | null, acceptLanguage: string | null): Lang {
  const first = next?.split('/')[1]?.split(/[?#]/)[0] ?? '';
  if (isLang(first)) return first;
  const prefs = (acceptLanguage ?? '')
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { lang: tag.split('-')[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((p) => p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const p of prefs) if (isLang(p.lang)) return p.lang;
  return 'en';
}
