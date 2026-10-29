import { getDb } from '@/lib/db';
import { exportArchive } from '@/lib/backup';
import { getSession } from '@/lib/admin/session';

/* "Download backup": the whole archive as one JSON file (lib/backup.ts), for a
   signed-in editor only. `npm run db:import -- --backup <file>` reads it back. */
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await getSession())) return new Response('Sign in first.', { status: 401 });
  const data = await exportArchive(getDb());
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 1), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="archivo-ihs-${day}.json"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
