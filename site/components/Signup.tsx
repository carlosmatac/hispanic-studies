'use client';

import { useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';

/* The pamphlet signup. The provider is not decided yet (#47), so the form
   says honestly that nothing was sent. */
export default function Signup({ lang }: { lang: Lang }) {
  const d = dict(lang).hero;
  const [done, setDone] = useState(false);
  return (
    <form className="signup" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
      <label className="sr" htmlFor="email">{d.emailLabel}</label>
      <input id="email" type="email" required autoComplete="email" placeholder={d.emailPlaceholder} />
      <button type="submit">{d.cta}</button>
      {done && <p className="signup__ok mono" role="status">{d.ok}</p>}
    </form>
  );
}
