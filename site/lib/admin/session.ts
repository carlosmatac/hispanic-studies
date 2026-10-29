import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

/* The back office's session: a signed, httpOnly cookie that names the user and
   the version of their password (changing the password logs every other
   device out). Signed with ADMIN_SESSION_SECRET (an env var on Vercel; at
   least 32 random characters). Locally, without it, a secret is made once and
   kept in site/.data/ (git-ignored). */

export const COOKIE = 'ihs_admin';
const MAX_AGE = 60 * 60 * 24 * 14; // two weeks

export type AdminUser = { id: number; username: string; displayName: string };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.VERCEL) throw new Error('ADMIN_SESSION_SECRET is missing or shorter than 32 characters.');
  const file = path.join(process.cwd(), '.data', 'dev-session-secret');
  try { return fs.readFileSync(file, 'utf8').trim(); } catch { /* first run */ }
  const made = randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, made);
  return made;
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const sign = (body: string) => createHmac('sha256', secret()).update(body).digest('base64url');

export function sealSession(user: { id: number; sessionVersion: number }) {
  const body = b64(JSON.stringify({ u: user.id, v: user.sessionVersion, e: Math.floor(Date.now() / 1000) + MAX_AGE }));
  return `${body}.${sign(body)}`;
}

function unseal(token: string | undefined): { u: number; v: number } | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof p.u !== 'number' || typeof p.v !== 'number' || p.e < Date.now() / 1000) return null;
    return { u: p.u, v: p.v };
  } catch { return null; }
}

/** The signed-in user, or null. Checked against the database on every request. */
export const getSession = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  const p = unseal(token);
  if (!p) return null;
  const [u] = await getDb().select().from(schema.users).where(eq(schema.users.id, p.u));
  if (!u || u.sessionVersion !== p.v) return null;
  return { id: u.id, username: u.username, displayName: u.displayName || u.username };
});

/** For pages and actions of the back office: the user, or off to the sign-in page. */
export async function requireSession(): Promise<AdminUser> {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  return user;
}

export async function setSessionCookie(user: { id: number; sessionVersion: number }) {
  (await cookies()).set(COOKIE, sealSession(user), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}
