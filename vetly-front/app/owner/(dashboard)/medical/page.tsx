'use client';

import { useState, useEffect } from 'react';
import { useMyPets, usePetMedicalHistory, OwnerMedicalEvent } from '@/hooks/useOwnerData';
import { api } from '@/lib/api';
import { ClinicPagination as Pagination, ClinicSelect, ClinicLoading, ClinicPanel, ClinicPageHeader, ClinicEmptyState } from '@/components/vet/ClinicUI';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import { ErrorBlock, DrawerHeader, Field, formatDay } from '@/components/owner/OwnerUI';

const eventTypeTranslations: Record<string, string> = {
  'Vaccination': 'Εμβολιασμός',
  'Checkup': 'Εξέταση',
  'Surgery': 'Χειρουργείο',
  'Dental': 'Οδοντιατρικά',
  'Emergency': 'Επείγον',
  'Lab Test': 'Εργαστηριακές',
  'X-Ray': 'Ακτινογραφία',
  'Medication': 'Φαρμακευτική',
};

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Όλα' },
  { value: 'Vaccination', label: 'Εμβολιασμός' },
  { value: 'Checkup', label: 'Εξέταση' },
  { value: 'Surgery', label: 'Χειρουργείο' },
  { value: 'Dental', label: 'Οδοντιατρικά' },
  { value: 'Emergency', label: 'Επείγον' },
  { value: 'Lab Test', label: 'Εργαστηριακά' },
  { value: 'X-Ray', label: 'Ακτινογραφία' },
  { value: 'Medication', label: 'Φαρμακευτική αγωγή' },
];

const typeBadge = 'inline-flex h-5 items-center rounded-full bg-ink-100 px-2 text-xs font-medium text-ink-700';
const rowGrid = 'lg:grid-cols-[120px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]';

export default function MedicalPage() {
  const { pets, loading: petsLoading } = useMyPets(1, 50);
  const [selectedPetId, setSelectedPetId] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OwnerMedicalEvent | null>(null);
  const [allError, setAllError] = useState('');
  const [allPages, setAllPages] = useState(1);

  // For single pet: use the hook with pagination
  const singlePetId = selectedPetId !== 'all' ? selectedPetId : null;
  const { events: singlePetEvents, totalPages: singlePetTotalPages, loading: singlePetLoading, error: singlePetError } = usePetMedicalHistory(
    singlePetId, page, 10, eventTypeFilter || undefined
  );

  // For "all pets": fetch from all pets combined
  const [allEvents, setAllEvents] = useState<OwnerMedicalEvent[]>([]);
  const [allTotal, setAllTotal] = useState(0);
  const [allLoading, setAllLoading] = useState(false);

  useEffect(() => {
    if (selectedPetId !== 'all' || petsLoading || pets.length === 0) return;

    let cancelled = false;
    const fetchAll = async () => {
      setAllLoading(true);
      setAllError('');
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('page_size', '10');
        if (eventTypeFilter) params.set('event_type', eventTypeFilter);
        const results = await Promise.all(
          pets.map(pet =>
            api.get<{ items: OwnerMedicalEvent[]; total: number }>(`/owner/pets/${pet.id}/medical-history?${params.toString()}`)
          )
        );
        if (cancelled) return;
        setAllPages(Math.max(1, ...results.map(r => Math.ceil(r.total / 10))));
        const combined = results.flatMap(r => r.items);
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalAll = results.reduce((sum, r) => sum + r.total, 0);
        setAllEvents(combined);
        setAllTotal(totalAll);
      } catch {
        if (cancelled) return;
        setAllError('Δεν φορτώθηκε το ιστορικό. Δοκίμασε ξανά αλλάζοντας το φίλτρο.');
        setAllEvents([]);
        setAllTotal(0);
      } finally {
        if (!cancelled) setAllLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [selectedPetId, pets, petsLoading, page, eventTypeFilter]);

  const events = selectedPetId === 'all' ? allEvents : singlePetEvents;
  const totalPages = selectedPetId === 'all' ? allPages : singlePetTotalPages;
  const loading = selectedPetId === 'all' ? allLoading : singlePetLoading;

  const handlePetChange = (petId: string) => {
    setSelectedPetId(petId);
    setPage(1);
  };

  const handleEventTypeChange = (type: string) => {
    setEventTypeFilter(type);
    setPage(1);
  };

  const error = selectedPetId === 'all' ? allError : singlePetError;
  const selectedPet = selected ? pets.find(p => p.id === selected.pet_id) : null;
  const formatDate = (value: string) => formatDay(value, { day: 'numeric', month: 'short', year: 'numeric' });
  return <div className="space-y-4 text-ink-800">
    <ClinicPageHeader title="Ιατρικό ιστορικό" description="Επισκέψεις, εξετάσεις και σημειώσεις στον φάκελο κάθε κατοικιδίου." />
    <ClinicPanel className="overflow-hidden">
      <div className="grid grid-cols-1 gap-3 border-b border-ink-200 p-4 sm:grid-cols-2">
        <Field label="Κατοικίδιο"><ClinicSelect className="h-10 w-full" value={selectedPetId} onChange={e => handlePetChange(e.target.value)}><option value="all">Όλα τα κατοικίδια</option>{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</ClinicSelect></Field>
        <Field label="Τύπος καταχώρισης"><ClinicSelect className="h-10 w-full" value={eventTypeFilter} onChange={e => handleEventTypeChange(e.target.value)}>{EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</ClinicSelect></Field>
      </div>
      <div className={`hidden gap-4 border-b border-ink-200 bg-ink-50 px-5 py-2 text-xs font-medium text-ink-500 lg:grid ${rowGrid}`}><span>Ημερομηνία</span><span>Καταχώριση</span><span>Κατοικίδιο</span><span>Κτηνίατρος</span></div>
      {petsLoading || loading ? <ClinicLoading /> : error ? <ErrorBlock message={selectedPetId === 'all' ? allError : undefined} /> : events.length ? events.map(event => { const pet = pets.find(p => p.id === event.pet_id); return <button key={event.id} onClick={() => setSelected(event)} className={`grid w-full gap-2 border-b border-ink-100 px-4 py-3.5 text-left hover:bg-ink-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinic-600 sm:px-5 lg:items-center lg:gap-4 ${rowGrid}`}>
        <time className="text-xs font-medium text-ink-500">{formatDate(event.date)}</time>
        <span className="min-w-0"><span className="block break-words text-sm font-semibold text-ink-900">{event.title}</span><span className={`${typeBadge} mt-1`}>{eventTypeTranslations[event.event_type] || event.event_type}</span></span>
        <span className="flex min-w-0 items-center gap-2"><ClinicAvatar name={pet?.name || 'Κατοικίδιο'} imageUrl={pet?.image_url} /><span className="truncate text-sm text-ink-700">{pet?.name || 'Κατοικίδιο'}</span></span>
        <span className="flex min-w-0 items-center justify-between gap-2 text-xs text-ink-500"><span className="break-words">{event.vet?.name || 'Δεν έχει καταχωριστεί κτηνίατρος'}</span><span aria-hidden="true">→</span></span>
      </button>}) : <ClinicEmptyState title="Δεν υπάρχουν καταχωρίσεις" description="Το ιστορικό των επισκέψεων θα εμφανίζεται εδώ. Δοκίμασε άλλη επιλογή φίλτρων." />}
      <div className="px-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      {selectedPetId === 'all' && allTotal > 0 && <p className="px-4 pb-3 pt-1 text-xs text-ink-500">{allTotal} καταχωρίσεις συνολικά · Έως 10 ανά κατοικίδιο σε κάθε σελίδα.</p>}
    </ClinicPanel>
    {selected && <ClinicDrawer label="Λεπτομέρειες ιστορικού" onClose={() => setSelected(null)}><div className="space-y-5 p-5">
      <DrawerHeader title={selected.title} subtitle={<>{eventTypeTranslations[selected.event_type] || selected.event_type} · {formatDate(selected.date)}</>} onClose={() => setSelected(null)} />
      <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3"><ClinicAvatar large name={selectedPet?.name || 'Κατοικίδιο'} imageUrl={selectedPet?.image_url} /><div className="min-w-0"><p className="break-words text-sm font-semibold text-ink-900">{selectedPet?.name || 'Κατοικίδιο'}</p><p className="mt-1 text-xs text-ink-500">Κτηνίατρος: {selected.vet?.name || 'Δεν έχει καταχωριστεί'}</p></div></div>
      <section><h3 className="border-b border-ink-200 pb-2 text-sm font-semibold text-ink-900">Σημειώσεις επίσκεψης</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">{selected.notes || 'Δεν έχουν καταχωριστεί σημειώσεις για αυτή την επίσκεψη.'}</p></section>
    </div></ClinicDrawer>}
  </div>;
}
