'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PREVIEW_COOKIE, PREVIEW_MAX_AGE, makePass, safeNext, same } from '@/lib/preview-gate';

/* The entry page's form (issue #86). The right password sets the preview pass
   (lib/preview-gate.ts) and goes on to where the visitor was going; a wrong one
   waits a moment before answering, so guessing is slow, and the page says so in
   place. */

export type EnterState = { wrong: number } | null;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function enter(prev: EnterState, form: FormData): Promise<EnterState> {
  const lang = form.get('lang') === 'es' ? 'es' : 'en';
  const next = safeNext(form.get('next')) ?? `/${lang}`;
  const password = process.env.SITE_PASSWORD;
  if (!password) redirect(next); // the site is open: nothing to check

  const given = String(form.get('password') ?? '');
  if (!same(given, password)) {
    await pause(1200 + Math.random() * 600);
    return { wrong: (prev?.wrong ?? 0) + 1 };
  }

  (await cookies()).set(PREVIEW_COOKIE, await makePass(password), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: PREVIEW_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
  redirect(next);
}
