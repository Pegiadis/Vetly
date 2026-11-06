'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Modal drawers share focus containment, Escape, scroll locking and focus return. */
export default function ClinicDrawer({ children, label, onClose, busy = false, embedded = false, narrow = false }: {
  children: ReactNode; label: string; onClose: () => void; busy?: boolean; embedded?: boolean; narrow?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (embedded) return;
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [embedded]);
  if (embedded) return <div>{children}</div>;
  return <dialog ref={ref} aria-label={label} aria-modal="true" aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )).filter(element => element.getClientRects().length > 0 && element.tabIndex >= 0);
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    className={`fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full overflow-y-auto border-0 bg-white p-0 text-ink-900 shadow-xl backdrop:bg-black/30 ${narrow ? 'max-w-sm' : 'max-w-lg'}`}>
    {children}
  </dialog>;
}
