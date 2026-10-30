import { NextResponse, type NextRequest } from 'next/server';
import { ENTER_PATH, PREVIEW_COOKIE, checkPass, entryLang, safeNext } from '@/lib/preview-gate';

/* A password in front of the whole site, for private previews (issues #62, #86).
   It is on only when SITE_PASSWORD is set (on Vercel, as a sensitive env var);
   locally, without it, the site is open.

   With it, a visitor needs the preview pass, a cookie set by the entry page
   (app/enter/[[...lang]], lib/preview-gate.ts) once the password is right. Without
   a valid pass, a page request is sent to the entry page, which brings the
   visitor back to where they were going (`next`); anything else (the reel,
   the Atlas's data, server actions, client-side navigations) gets a plain 401.
   The entry page and what it needs (its scripts, styles and fonts, the eagle)
   always pass. Changing SITE_PASSWORD signs everyone out. */

/* The back office (/admin, issue #69) has its own sign-in (lib/admin/session.ts)
   and sits behind the preview password like every other page. It is never
   indexed, and neither is the entry page. */
const ADMIN = /^\/admin(\/|$)/;
const ENTER = /^\/enter(\/|$)/;
/* Always open: what the entry page needs (scripts, styles, fonts, the eagle),
   and the pictures in public/art and public/brand. The pictures must be: the
   image optimizer (/_next/image, itself behind the pass) fetches them from the
   site without the visitor's cookie, and they are the art and the brand the
   public site shows anyway. Pages, videos, data and the archive stay closed. */
const OPEN = /^\/(_next\/static\/|_next\/webpack-hmr|__nextjs|favicon\.ico$|robots\.txt$|(art|brand)\/[^?#]+\.(jpe?g|png|webp|avif|gif|svg)$)/i;

// a browser asking for a page, not a script fetching data, a file or an RSC payload
function wantsPage(request: NextRequest) {
  const h = request.headers;
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (h.has('rsc') || h.has('next-action') || h.has('next-router-prefetch')) return false;
  const dest = h.get('sec-fetch-dest');
  if (dest) return dest === 'document';
  return (h.get('accept') ?? '').includes('text/html');
}

const NOINDEX = 'noindex, nofollow';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const pass = () => {
    const res = NextResponse.next();
    if (ADMIN.test(pathname) || ENTER.test(pathname)) res.headers.set('X-Robots-Tag', NOINDEX);
    return res;
  };

  const password = process.env.SITE_PASSWORD;
  if (!password || OPEN.test(pathname)) return pass();

  const inside = await checkPass(password, request.cookies.get(PREVIEW_COOKIE)?.value);

  if (ENTER.test(pathname)) {
    // already inside: the entry page has nothing to ask, go on
    if (inside && wantsPage(request)) {
      const next = safeNext(request.nextUrl.searchParams.get('next'));
      const lang = entryLang(next, request.headers.get('accept-language'));
      return NextResponse.redirect(new URL(next ?? `/${lang}`, request.url), 303);
    }
    return pass();
  }

  if (inside) return pass();

  if (wantsPage(request)) {
    const next = safeNext(pathname + search) ?? '/';
    const lang = entryLang(next, request.headers.get('accept-language'));
    const to = new URL(`${ENTER_PATH}/${lang}`, request.url);
    if (next !== '/' && next !== `/${lang}`) to.searchParams.set('next', next);
    const res = NextResponse.redirect(to, 307);
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', NOINDEX);
    return res;
  }
  return new NextResponse('The preview is private.', {
    status: 401,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': NOINDEX },
  });
}

// everything, the videos and data files included
export const config = { matcher: '/:path*' };
