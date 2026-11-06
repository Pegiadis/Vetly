'use client';
import { useState } from 'react';
import { useMyMedications, useMyPets, type OwnerMedication } from '@/hooks/useOwnerData';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { ClinicButton, ClinicSelect, ClinicLoading, ClinicPagination } from '@/components/vet/ClinicUI';
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('el-GR') : 'Χωρίς ημερομηνία λήξης';
function status(m: OwnerMedication) {
  if (!m.is_active) return 'Ανενεργή';
  if (m.end_date && new Date(m.end_date) < new Date(new Date().toDateString())) return 'Έληξε η περίοδος';
  return 'Ενεργή';
}
export default function MedicationsPage() {
  const [active, setActive] = useState(true);
  const [petId, setPetId] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OwnerMedication | null>(null);
  const { medications, total, totalPages, loading, error } = useMyMedications(active, page, 10, petId || undefined);
  const { pets } = useMyPets(1, 50);
  return <div className="mx-auto max-w-[1280px]">
    <header className="mb-5"><h1 className="text-xl font-semibold text-ink-900">Φάρμακα</h1><p className="mt-1 text-sm text-ink-500">Η αγωγή, η δοσολογία και οι οδηγίες για κάθε κατοικίδιο.</p></header>
    <section className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
        <div className="flex gap-1" aria-label="Κατάσταση αγωγής">{[true,false].map(value => <ClinicButton key={String(value)} aria-pressed={active === value} variant={active === value ? 'primary' : 'ghost'} onClick={() => {setActive(value);setPage(1);}}>{value ? 'Ενεργές αγωγές' : 'Παλαιότερες'}</ClinicButton>)}</div>
        <ClinicSelect aria-label="Κατοικίδιο" className="w-full sm:w-52" value={petId} onChange={e => {setPetId(e.target.value);setPage(1);}}><option value="">Όλα τα κατοικίδια</option>{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</ClinicSelect>
      </div>
      <div className="flex items-center justify-between gap-2 px-5 py-3"><h2 className="text-sm font-semibold text-ink-900">{active ? 'Τρέχουσα αγωγή' : 'Αρχείο αγωγών'}</h2><span className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} καταχωρίσεις`}</span></div>
      <div className="hidden grid-cols-[1.4fr_1.2fr_1fr_130px] gap-4 border-y border-ink-200 bg-ink-50 px-5 py-2 text-xs text-ink-500 lg:grid"><span>Φάρμακο / Κατοικίδιο</span><span>Δοσολογία / Συχνότητα</span><span>Διάρκεια</span><span>Κατάσταση</span></div>
      {loading ? <ClinicLoading /> : error ? <p role="alert" className="p-5 text-sm text-red-700">{error}</p> : medications.length ? medications.map(m => <button key={m.id} onClick={() => setSelected(m)} className="grid w-full gap-3 border-b border-ink-100 px-4 py-4 text-left hover:bg-ink-50 focus-visible:outline-clinic-600 sm:px-5 lg:grid-cols-[1.4fr_1.2fr_1fr_130px] lg:items-center lg:gap-4">
        <span className="flex min-w-0 items-center gap-3"><ClinicAvatar name={m.pet?.name || 'Κατοικίδιο'} imageUrl={m.pet?.image_url} /><span className="min-w-0"><span className="block break-words text-sm font-semibold text-ink-900">{m.name}</span><span className="text-xs text-ink-500">{m.pet?.name}</span></span></span>
        <span className="min-w-0 break-words"><span className="block text-sm font-medium text-ink-800">{m.dosage || 'Δεν έχει καταχωριστεί δοσολογία'}</span><span className="mt-1 block text-xs text-ink-500">{[m.frequency,m.time].filter(Boolean).join(' · ')}</span></span>
        <span className="text-xs leading-5 text-ink-500">Από {date(m.start_date)}<span className="block">{m.end_date ? `Έως ${date(m.end_date)}` : date(null)}</span></span>
        <span className="flex items-center justify-between gap-3"><span className={`rounded-md px-2 py-1 text-xs ${status(m) === 'Ενεργή' ? 'bg-clinic-100 text-clinic-800' : 'bg-ink-100 text-ink-600'}`}>{status(m)}</span><span aria-hidden="true" className="text-ink-400">↗</span></span>
      </button>) : <div className="p-10 text-center text-sm text-ink-500">Δεν υπάρχουν {active ? 'ενεργές' : 'παλαιότερες'} αγωγές για αυτή την επιλογή.</div>}
      <div className="px-4"><ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
    </section>
    <p className="mt-4 text-xs leading-5 text-ink-500">Επιλέξτε μια αγωγή για τις πλήρεις καταγεγραμμένες οδηγίες του κτηνιάτρου.</p>
    {selected && <ClinicDrawer label="Λεπτομέρειες αγωγής" onClose={() => setSelected(null)}><div className="space-y-5 p-5"><div className="flex justify-end"><button type="button" onClick={() => setSelected(null)} aria-label="Κλείσιμο λεπτομερειών" className="rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50">Κλείσιμο ×</button></div>
      <header className="flex items-center gap-3"><ClinicAvatar large name={selected.pet?.name || 'Κατοικίδιο'} imageUrl={selected.pet?.image_url} /><div className="min-w-0"><p className="text-xs text-ink-500">{selected.pet?.name}</p><h2 className="break-words text-lg font-semibold text-ink-900">{selected.name}</h2></div></header>
      <section className="rounded-xl border border-clinic-200 bg-clinic-50 p-4"><h3 className="text-xs font-medium text-clinic-700">ΚΑΤΑΓΕΓΡΑΜΜΕΝΗ ΑΓΩΓΗ</h3><p className="mt-2 break-words text-lg font-semibold text-ink-900">{selected.dosage || 'Δεν έχει καταχωριστεί'}</p><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-ink-500">Συχνότητα</dt><dd className="break-words text-ink-900">{selected.frequency || 'Δεν έχει καταχωριστεί'}</dd></div><div><dt className="text-ink-500">Ώρα</dt><dd className="break-words text-ink-900">{selected.time || 'Δεν έχει καταχωριστεί'}</dd></div></dl></section>
      <dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-ink-500">Έναρξη</dt><dd>{date(selected.start_date)}</dd></div><div><dt className="text-ink-500">Λήξη</dt><dd>{date(selected.end_date)}</dd></div></dl>
      <section className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold text-ink-900">Οδηγίες και σημειώσεις</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{selected.notes || 'Δεν έχουν καταχωριστεί επιπλέον σημειώσεις.'}</p></section>
    </div></ClinicDrawer>}
  </div>;
}
