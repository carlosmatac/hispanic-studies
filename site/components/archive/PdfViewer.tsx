import { dict, type Lang } from '@/lib/i18n';

/* A hosted PDF (issue #93): only for an edition approved to be hosted here
   under U.S. law (lib/editions.ts hostedMode), whose checked file is stored in
   Vercel Blob (docs/cms.md). The browser's own PDF viewer, embedded: it takes
   the keyboard (Tab into it, arrows and Page Up / Page Down to read, Ctrl+F to
   search). Where a browser cannot embed a PDF (most phones), the fallback
   offers it in a new tab. The download is a separate link, as the brief asks. */

export default function PdfViewer({ id, url, title, heading, lang }: { id: string; url: string; title: string; heading: string; lang: Lang }) {
  const t = dict(lang).archive80;
  return (
    <section className="w80-pdf" id={`pdf-${id}`} aria-labelledby={`pdf-${id}-h`}>
      <h2 id={`pdf-${id}-h`}>{heading}</h2>
      <p className="w80-pdf__hint">{t.pdf.hint}</p>
      <object className="w80-pdf__frame" data={url} type="application/pdf" aria-label={t.pdf.title(title)} tabIndex={0}>
        <p className="w80-pdf__fallback">
          {t.pdf.fallback} <a href={url} target="_blank" rel="noopener">{t.pdf.newTab}</a>
        </p>
      </object>
      <p className="w80-pdf__actions">
        <a className="w80-btn" href={url} target="_blank" rel="noopener">{t.pdf.newTab}<span className="sr"> ({t.newTab})</span></a>
        <a className="w80-btn w80-btn--quiet" href={url} download>{t.button.download}</a>
      </p>
    </section>
  );
}
