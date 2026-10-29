'use client';

import { useRef, useState, useTransition } from 'react';

/* A button that asks first, in a small dialog (Esc or "Cancel" closes it).
   Either runs a function in the page (onConfirm) or a Server Action (action). */
export default function ConfirmButton({ label, question, confirm, cancel, onConfirm, action, className, danger = true }: {
  label: string; question: string; confirm: string; cancel: string; className?: string; danger?: boolean;
  onConfirm?: () => void; action?: () => Promise<unknown>;
}) {
  const box = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const yes = () => {
    if (action) start(async () => { await action(); box.current?.close(); });
    else { onConfirm?.(); box.current?.close(); }
  };
  return (
    <>
      <button type="button" className={className} onClick={() => { setOpen(true); box.current?.showModal(); }}>{label}</button>
      <dialog ref={box} className="adm-dialog" onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) box.current?.close(); }} aria-label={label}>
        {open && (
          <div className="adm-dialog__sheet">
            <p>{question}</p>
            <div className="adm-dialog__actions">
              <button type="button" className="adm-btn" onClick={() => box.current?.close()} autoFocus>{cancel}</button>
              <button type="button" className={`adm-btn ${danger ? 'adm-btn--danger' : 'adm-btn--primary'}`} onClick={yes} disabled={pending}>{pending ? '…' : confirm}</button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
