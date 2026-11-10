'use client';
import { useState } from 'react';
import { useMyMedications, useMyPets, type OwnerMedication } from '@/hooks/useOwnerData';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { ClinicSelect, ClinicLoading, ClinicPagination, ClinicPanel, ClinicPageHeader, ClinicFilterTabs, ClinicStatusBadge, ClinicEmptyState } from '@/components/vet/ClinicUI';
import { ErrorBlock, DrawerHeader, Fact, athensNow, formatDay } from '@/components/owner/OwnerUI';

const tabOptions = [{ value: 'active', label: 'Ενεργές αγωγές' }, { value: 'past', label: 'Παλαιότερες' }] as const;
const rowGrid = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_130px]';
// Medication dates are calendar days, so they are shown as written.
const date = (value: string | null) => value ? formatDay(value, { day: 'numeric', month: 'numeric', year: 'numeric' }) : 'Χωρίς ημερομηνία λήξης';
function status(m: OwnerMedication) {
  if (!m.is_active) return 'Ανενεργή';
  if (m.end_date && m.end_date.slice(0, 10) < athensNow().slice(0, 10)) return 'Έληξε η περίοδος';
  return 'Ενεργή';
}
export default function MedicationsPage() {
  const [active, setActive] = useState(true);
  const [petId, setPetId] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OwnerMedication | null>(null);
  const { medications, total, totalPages, loading, error, refetch } = useMyMedications(active, page, 10, petId || undefined);
  const { pets } = useMyPets(1, 50);
  return <div className="space-y-4 text-ink-800">
    <ClinicPageHeader title="Φάρμακα" description="Η αγωγή, η δοσολογία και οι οδηγίες για κάθε κατοικίδιο." />
    <ClinicPanel className="overflow-hidden">
      <ClinicFilterTabs label="Κατάσταση αγωγής" options={tabOptions} value={active ? 'active' : 'past'} onChange={value => { setActive(value === 'active'); setPage(1); }} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
        <ClinicSelect aria-label="Κατοικίδιο" className="h-10 w-full sm:w-56" value={petId} onChange={e => { setPetId(e.target.value); setPage(1); }}><option value="">Όλα τα κατοικίδια</option>{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</ClinicSelect>
        <span className="text-xs text-ink-500">{loading ? 'Φόρτωση…' : `${total} καταχωρίσεις`}</span>
      </div>
      <div className={`hidden gap-4 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 lg:grid ${rowGrid}`}><span>Φάρμακο / Κατοικίδιο</span><span>Δοσολογία / Συχνότητα</span><span>Διάρκεια</span><span>Κατάσταση</span></div>
      {loading ? <ClinicLoading /> : error ? <ErrorBlock onRetry={refetch} /> : medications.length ? medications.map(m => <button key={m.id} onClick={() => setSelected(m)} className={`grid w-full gap-2 border-b border-ink-100 px-4 py-3.5 text-left hover:bg-ink-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinic-600 sm:px-5 lg:items-center lg:gap-4 ${rowGrid}`}>
        <span className="flex min-w-0 items-center gap-3"><ClinicAvatar name={m.pet?.name || 'Κατοικίδιο'} imageUrl={m.pet?.image_url} /><span className="min-w-0"><span className="block break-words text-sm font-semibold text-ink-900">{m.name}</span><span className="text-xs text-ink-500">{m.pet?.name}</span></span></span>
        <span className="min-w-0 break-words"><span className="block text-sm font-medium text-ink-800">{m.dosage || 'Δεν έχει καταχωριστεί δοσολογία'}</span><span className="mt-0.5 block text-xs text-ink-500">{[m.frequency, m.time].filter(Boolean).join(' · ')}</span></span>
        <span className="text-xs leading-5 text-ink-500">Από {date(m.start_date)}<span className="block">{m.end_date ? `Έως ${date(m.end_date)}` : date(null)}</span></span>
        <span className="flex items-center justify-between gap-3"><ClinicStatusBadge status={status(m) === 'Ενεργή' ? 'completed' : 'neutral'}>{status(m)}</ClinicStatusBadge><span aria-hidden="true" className="text-ink-400">→</span></span>
      </button>) : <ClinicEmptyState title={`Δεν υπάρχουν ${active ? 'ενεργές' : 'παλαιότερες'} αγωγές`} description="Δοκίμασε άλλη επιλογή κατοικιδίου ή προβολής." />}
      <div className="px-4"><ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      {!loading && !error && medications.length > 0 && <p className="px-4 pb-3 pt-1 text-xs leading-5 text-ink-500">Επίλεξε μια αγωγή για τις πλήρεις καταγεγραμμένες οδηγίες του κτηνιάτρου.</p>}
    </ClinicPanel>
    {selected && <ClinicDrawer label="Λεπτομέρειες αγωγής" onClose={() => setSelected(null)}><div className="space-y-5 p-5">
      <DrawerHeader title={selected.name} subtitle={selected.pet?.name} onClose={() => setSelected(null)} />
      <div className="flex items-center gap-3"><ClinicAvatar large name={selected.pet?.name || 'Κατοικίδιο'} imageUrl={selected.pet?.image_url} /><ClinicStatusBadge status={status(selected) === 'Ενεργή' ? 'completed' : 'neutral'}>{status(selected)}</ClinicStatusBadge></div>
      <section className="rounded-xl border border-clinic-100 bg-clinic-50 p-4"><h3 className="text-xs font-medium text-clinic-800">Καταγεγραμμένη αγωγή</h3><p className="mt-2 break-words text-lg font-semibold text-ink-900">{selected.dosage || 'Δεν έχει καταχωριστεί'}</p><dl className="mt-4 grid gap-3 sm:grid-cols-2"><Fact label="Συχνότητα">{selected.frequency || 'Δεν έχει καταχωριστεί'}</Fact><Fact label="Ώρα">{selected.time || 'Δεν έχει καταχωριστεί'}</Fact></dl></section>
      <dl className="grid grid-cols-2 gap-4"><Fact label="Έναρξη">{date(selected.start_date)}</Fact><Fact label="Λήξη">{date(selected.end_date)}</Fact></dl>
      <section className="border-t border-ink-200 pt-4"><h3 className="text-sm font-semibold text-ink-900">Οδηγίες και σημειώσεις</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-600">{selected.notes || 'Δεν έχουν καταχωριστεί επιπλέον σημειώσεις.'}</p></section>
    </div></ClinicDrawer>}
  </div>;
}
