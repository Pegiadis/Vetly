'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

const field = 'block h-10 w-full rounded-[10px] border border-ink-300 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clinic-600 focus:outline-2 focus:outline-offset-1 focus:outline-clinic-200';
const label = 'mb-1.5 block text-xs font-medium text-ink-700';

const EMPTY = { name: '', clinic_name: '', email: '', phone: '', city: '', message: '', website: '' };

/** The "Κλείστε demo" form. Vets do not register themselves; the team creates the account after the demo. */
export default function DemoRequestForm() {
  const [values, setValues] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues(current => ({ ...current, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/public/demo-requests', { ...values, message: values.message.trim() || null, website: values.website || null });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Η αποστολή απέτυχε. Δοκιμάστε ξανά.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return <div role="status" className="rounded-xl border border-clinic-200 bg-clinic-50 p-6">
      <h3 className="text-base font-semibold text-clinic-900">Λάβαμε το αίτημά σας</h3>
      <p className="mt-1.5 text-sm leading-6 text-clinic-800">Θα επικοινωνήσουμε μαζί σας σύντομα για να κλείσουμε ώρα για την παρουσίαση. Σας στείλαμε και επιβεβαίωση στο {values.email}.</p>
    </div>;
  }

  return <form onSubmit={submit} className="rounded-xl border border-ink-200 bg-white p-5 sm:p-6">
    {error && <p role="alert" className="mb-4 rounded-[10px] bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="demo-name" className={label}>Ονοματεπώνυμο</label><input id="demo-name" required minLength={2} maxLength={255} autoComplete="name" value={values.name} onChange={set('name')} className={field} /></div>
      <div><label htmlFor="demo-clinic" className={label}>Κτηνιατρείο</label><input id="demo-clinic" required minLength={2} maxLength={255} autoComplete="organization" value={values.clinic_name} onChange={set('clinic_name')} className={field} /></div>
      <div><label htmlFor="demo-email" className={label}>Email</label><input id="demo-email" type="email" required maxLength={255} autoComplete="email" value={values.email} onChange={set('email')} className={field} /></div>
      <div><label htmlFor="demo-phone" className={label}>Τηλέφωνο</label><input id="demo-phone" type="tel" required minLength={5} maxLength={50} autoComplete="tel" value={values.phone} onChange={set('phone')} className={field} /></div>
      <div className="sm:col-span-2"><label htmlFor="demo-city" className={label}>Πόλη</label><input id="demo-city" required minLength={2} maxLength={100} autoComplete="address-level2" value={values.city} onChange={set('city')} className={field} /></div>
      <div className="sm:col-span-2"><label htmlFor="demo-message" className={label}>Μήνυμα <span className="font-normal text-ink-500">(προαιρετικό)</span></label><textarea id="demo-message" rows={3} maxLength={2000} value={values.message} onChange={set('message')} placeholder="Π.χ. πόσοι γιατροί είστε ή ποια μέρα σας βολεύει" className={`${field} h-auto resize-y py-2`} /></div>
      {/* Hidden from people; bots that fill every field are dropped by the server. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><label htmlFor="demo-website">Website</label><input id="demo-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} /></div>
    </div>
    <p className="mt-4 text-xs leading-5 text-ink-500">Χρησιμοποιούμε τα στοιχεία μόνο για να επικοινωνήσουμε μαζί σας για την παρουσίαση. Δείτε την <Link href="/privacy" className="font-medium text-clinic-700 underline-offset-4 hover:underline">Πολιτική απορρήτου</Link>.</p>
    <button type="submit" disabled={sending} className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] bg-clinic-600 px-5 text-sm font-medium text-white hover:bg-clinic-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-70">{sending ? 'Αποστολή…' : 'Κλείστε demo'}</button>
  </form>;
}
