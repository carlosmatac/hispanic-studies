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

export function proxy(request: NextRequest) {
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
