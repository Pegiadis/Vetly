'use client';

import { useEffect, useState } from 'react';
import { ClinicButton, ClinicInput } from '@/components/vet/ClinicUI';

export default function AdminSearch({ value, label, placeholder, onSearch }: { value: string; label: string; placeholder: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  return <form role="search" className="flex min-w-0 flex-1 gap-2" onSubmit={e => { e.preventDefault(); onSearch(text.trim()); }}>
    <ClinicInput type="search" aria-label={label} placeholder={placeholder} value={text} maxLength={100} onChange={e => setText(e.target.value)} className="min-w-0 flex-1 sm:max-w-sm" />
    <ClinicButton type="submit">Αναζήτηση</ClinicButton>
    {value && <ClinicButton type="button" variant="ghost" onClick={() => onSearch('')}>Καθαρισμός</ClinicButton>}
  </form>;
}
