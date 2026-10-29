import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/admin/session';

/* "View on the site": turns Draft Mode on for the signed-in editor (so drafts
   show) and goes to the page. Only paths of the site itself. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') ?? '/es/archive';
  const safe = /^\/(en|es)(\/[\w#./-]*)?$/.test(path) ? path : '/es/archive';
  if (await getSession()) (await draftMode()).enable();
  redirect(safe);
}
