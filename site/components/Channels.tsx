import { dict, type Lang } from '@/lib/i18n';
import { CHANNELS, channel, type ChannelKey } from '@/lib/content';
import ChannelIcon from './ChannelIcon';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** A row of seals, icon only: the hero and the footer base. */
export function SealRow({ lang, keys, className = '' }: { lang: Lang; keys?: ChannelKey[]; className?: string }) {
  const d = dict(lang);
  const list = keys ? keys.map(channel) : CHANNELS;
  return (
    <ul className={`seals ${className}`}>
      {list.map((c) => (
        <li key={c.key}>
          <a className="seal-link" href={c.url} {...ext} aria-label={`${c.name} (${d.about.newTab})`} title={c.name}>
            <ChannelIcon name={c.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Seal + name + handle + count, as a link: section heads (Watch, Read). */
export function ChannelBadge({ lang, name, label, unit }: { lang: Lang; name: ChannelKey; label: string; unit?: string }) {
  const d = dict(lang);
  const c = channel(name);
  return (
    <a className="badge" href={c.url} {...ext}>
      <ChannelIcon name={c.key} />
      <span className="badge__txt">
        <span className="badge__label">{label}</span>
        <span className="badge__meta">{c.handle}{c.following && unit ? ` · ${c.following} ${unit}` : ''}</span>
      </span>
      <span className="sr">({d.about.newTab})</span>
      <span className="badge__arrow" aria-hidden="true">↗</span>
    </a>
  );
}

/** Every channel as a card: the About section. */
export function ChannelGrid({ lang }: { lang: Lang }) {
  const d = dict(lang);
  return (
    <ul className="chan-grid">
      {CHANNELS.map((c) => (
        <li key={c.key}>
          <a className="chan" href={c.url} {...ext}>
            <ChannelIcon name={c.key} />
            <span className="chan__name">{c.name}</span>
            <span className="chan__handle">{c.handle}</span>
            {c.following && c.unit && <span className="chan__count">{c.following} <small>{d.about[c.unit]}</small></span>}
            <span className="sr">({d.about.newTab})</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
