import { NextResponse, type NextRequest } from 'next/server';

/* A password in front of the whole site, for private previews (issue #62).
   It is on only when SITE_PASSWORD is set (on Vercel, as a sensitive env var);
   locally, without it, the site is open. The browser asks for a user and a
   password: any user name works, the password must match. */

const REALM = 'Institute for Hispano Studies (preview)';

// compare without leaking where the first difference is
function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* The CMS (/keystatic and its API, issue #69). Locally (`next dev`) it edits
   the files on disk. On a deployment it is open only when the GitHub login is
   configured (docs/cms.md); otherwise it does not exist. It has its own login
   (GitHub), so the preview password does not stand in front of it, and it is
   never indexed. */
const CMS = /^\/(api\/)?keystatic(\/|$)/;
const cmsEnabled = () =>
  process.env.NODE_ENV === 'development' ||
  (process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github' &&
    !!process.env.KEYSTATIC_GITHUB_CLIENT_ID && !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET && !!process.env.KEYSTATIC_SECRET);

export function proxy(request: NextRequest) {
  if (CMS.test(request.nextUrl.pathname)) {
    if (!cmsEnabled()) return new NextResponse('Not found.', { status: 404 });
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (same(given, password)) return NextResponse.next();
    } catch { /* a malformed header is simply refused */ }
  }
  return new NextResponse('Password required.', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`, 'Cache-Control': 'no-store' },
  });
}

// everything, the videos and data files included
export const config = { matcher: '/:path*' };
