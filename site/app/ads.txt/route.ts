/* AdSense's ads.txt (issue #70): the publisher id without its "ca-" prefix, f08c47fec0942fa0 being
   Google's own certification authority id. No id set, no file (404), so the preview serves nothing. */
export function GET() {
  const pub = process.env.NEXT_PUBLIC_ADSENSE_ID?.replace(/^ca-/, '');
  if (!pub) return new Response('Not found', { status: 404 });
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
