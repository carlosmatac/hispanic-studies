import React from 'react';

/* One field of a back-office form: its label, the control, help under it and
   what is wrong in red (wired to the control for screen readers). */
export default function Field({ label, help, error, children, wide, id }: { label: string; help?: string; error?: string; children: React.ReactElement<Record<string, unknown>>; wide?: boolean; id: string }) {
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = React.cloneElement(children, {
    id, 'aria-invalid': error ? true : undefined, 'aria-describedby': [helpId, errId].filter(Boolean).join(' ') || undefined,
  });
  return (
    <div className={`adm-field${wide ? ' adm-field--wide' : ''}${error ? ' is-error' : ''}`}>
      <label className="adm-field__label" htmlFor={id}>{label}</label>
      {control}
      {help && <p className="adm-help" id={helpId}>{help}</p>}
      {error && <p className="adm-field__error" id={errId}>{error}</p>}
    </div>
  );
}
