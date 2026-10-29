import { cookies } from 'next/headers';
import { adminDict, isLang, type Lang } from '@/lib/i18n';

/* The back office speaks Spanish unless the editor picks English (a cookie). */
export const LANG_COOKIE = 'ihs_admin_lang';

export async function adminLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value ?? '';
  return isLang(v) ? v : 'es';
}

export async function adminText() {
  const lang = await adminLang();
  return { lang, t: adminDict(lang) };
}
