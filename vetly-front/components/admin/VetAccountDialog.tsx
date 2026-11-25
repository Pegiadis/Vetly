'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClinicButton, ClinicInput } from '@/components/vet/ClinicUI';
import { ApiError } from '@/lib/api';
import { adminApi } from '@/lib/admin-api';
import type { AdminVet, AdminVetCreate, DemoRequest } from '@/types/admin';

type Fields = Omit<AdminVetCreate, 'demo_request_id'>;

const FIELDS: { key: keyof Fields; label: string; type?: string; hint?: string; wide?: boolean }[] = [
  { key: 'name', label: 'Ονοματεπώνυμο κτηνιάτρου' },
  { key: 'email', label: 'Email', type: 'email', hint: 'Εδώ πηγαίνει ο σύνδεσμος για τον κωδικό.' },
  { key: 'phone', label: 'Τηλέφωνο', type: 'tel' },
  { key: 'city', label: 'Πόλη' },
  { key: 'address', label: 'Διεύθυνση ιατρείου', wide: true },
  { key: 'specialty', label: 'Ειδικότητα' },
  { key: 'license_number', label: 'Αριθμός άδειας' },
];

/** Creates a vet account, optionally from a demo request whose details prefill the form. */
export default function VetAccountDialog({ demo, onClose, onCreated }: { demo?: DemoRequest; onClose: () => void; onCreated: (vet: AdminVet) => void }) {
  const titleId = useId();
  const firstRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<Fields>({
    name: demo?.name ?? '', email: demo?.email ?? '', phone: demo?.phone ?? '', city: demo?.city ?? '',
    address: '', specialty: '', license_number: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const vet = await adminApi.post<AdminVet>('/vets', { ...values, ...(demo ? { demo_request_id: demo.id } : {}) });
      onCreated(vet);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Η δημιουργία απέτυχε. Δοκιμάστε ξανά.');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <h2 id={titleId} className="text-lg font-semibold text-ink-900">Νέος λογαριασμός κτηνιάτρου</h2>
        <p className="mt-1 text-sm text-ink-500">{demo ? `Από αίτημα demo: ${demo.clinic_name}. ` : ''}Ο λογαριασμός ενεργοποιείται αμέσως· ο κτηνίατρος λαμβάνει email για να ορίσει κωδικό.</p>
        {error && <p role="alert" className="mt-4 rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f, index) => <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
            <label htmlFor={`vet-${f.key}`} className="mb-1 block text-xs font-medium text-ink-700">{f.label}</label>
            <ClinicInput ref={index === 0 ? firstRef : undefined} id={`vet-${f.key}`} type={f.type ?? 'text'} required value={values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} className="w-full" />
            {f.hint && <p className="mt-1 text-xs text-ink-500">{f.hint}</p>}
          </div>)}
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <ClinicButton type="button" disabled={saving} onClick={onClose}>Ακύρωση</ClinicButton>
            <ClinicButton type="submit" variant="primary" disabled={saving}>{saving ? 'Δημιουργία…' : 'Δημιουργία και αποστολή email'}</ClinicButton>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
