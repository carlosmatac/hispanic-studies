import { revalidatePath, updateTag } from 'next/cache';
import { ARCHIVE_TAG } from '@/lib/archive';

/* After any save in the back office: the cached archive is expired at once
   (updateTag, so the next visitor gets fresh data, not a stale page) and every
   page is regenerated on its next visit (the archive, the works, the home's
   door). Nothing needs a redeploy. Only callable from Server Actions. */
export function refreshSite() {
  updateTag(ARCHIVE_TAG);
  revalidatePath('/', 'layout');
}
