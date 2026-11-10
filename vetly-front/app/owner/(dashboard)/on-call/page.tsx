'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useMyPets, useOnCallVets, useAvailableSlots, createBatchAppointments, OnCallVet, Pet } from '@/hooks/useOwnerData';
import { ApiError } from '@/lib/api';
import CalendarPicker from '@/components/CalendarPicker';
import { OnCallMap } from '@/components/MapView';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { ClinicButton, ClinicInput, ClinicSelect, ClinicTextarea, ClinicLoading, ClinicPagination, ClinicPageHeader } from '@/components/vet/ClinicUI';
import { ErrorBlock, linkPrimary, linkSecondary } from '@/components/owner/OwnerUI';

type Step = 1 | 2 | 3 | 4;

export default function OnCallPage() {
  const [petPage, setPetPage] = useState(1);
  const { pets, totalPages: petPages, loading: petsLoading, error: petsError, refetch: refetchPets } = useMyPets(petPage, 6);
  const [petCache, setPetCache] = useState<Record<string, Pet>>({});
  useEffect(() => {setPetCache(prev => ({...prev, ...Object.fromEntries(pets.map(p => [p.id,p]))}));}, [pets]);
  const { vets, loading: vetsLoading, error: vetsError, refetch: refetchVets } = useOnCallVets();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [details, setDetails] = useState<OnCallVet | null>(null);
  const sending = useRef(false);
  const [step, setStep] = useState<Step>(1);
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [selectedVet, setSelectedVet] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emergencyTypes = [
    { id: 'Τραυματισμός', name: 'Τραυματισμός' },
    { id: 'Δηλητηρίαση', name: 'Δηλητηρίαση' },
    { id: 'Δύσπνοια', name: 'Δύσπνοια' },
    { id: 'Σπασμοί', name: 'Σπασμοί' },
    { id: 'Άλλο Επείγον', name: 'Άλλο Επείγον' },
  ];

  const [emergencyType, setEmergencyType] = useState('');

  const { slots: availableSlots, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useAvailableSlots(selectedVet, selectedDate);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedVet, selectedDate]);

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedVetData && !vetsError;
      case 2: return selectedPets.size > 0 && emergencyType !== '';
      case 3: return selectedDate && selectedTime && !slotsLoading && availableSlots.includes(selectedTime);
      case 4: return true;
      default: return false;
    }
  };

  const handleConfirm = async () => {
    if (sending.current || !selectedVetData || vetsError || slotsLoading || !selectedTime || !availableSlots.includes(selectedTime) || selectedPets.size === 0 || !selectedVet || !selectedDate || !selectedTime) return;

    sending.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const scheduledAt = `${selectedDate}T${selectedTime}:00`;
      const petIds = Array.from(selectedPets);
      const types: Record<string, string> = {};
      for (const petId of petIds) {
        types[petId] = emergencyType;
      }

      await createBatchAppointments({
        vet_id: selectedVet!,
        pet_ids: petIds,
        scheduled_at: scheduledAt,
        types,
        duration_minutes: 30, // Emergency triage default
        notes: notes || undefined,
      });
      setStep(4);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError(err.message);
        setSelectedTime(null);
        refetchSlots();
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Αποτυχία δημιουργίας ραντεβού. Δοκιμάστε ξανά.');
      }
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!canProceed() || submitting) return;
    if (step === 3) {
      handleConfirm();
    } else {
      setStep((s) => Math.min(4, s + 1) as Step);
    }
  };

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  const selectedVetData = vets.find(v => v.id === selectedVet);

  const filteredVets = vets.filter(v => (!city || v.city === city) && `${v.name} ${v.city} ${v.address}`.toLocaleLowerCase('el').includes(search.toLocaleLowerCase('el')));
  const mapMarkers = filteredVets.map((v: OnCallVet) => ({
    id: v.id,
    name: v.name,
    specialty: v.specialty,
    phone: v.phone,
    address: v.address,
    rating_average: v.rating_average,
    reviews_count: v.reviews_count,
    lat: v.coordinates_lat,
    lng: v.coordinates_lng,
  }));

  const chooseVet = (id: string) => {setSelectedVet(id);setSelectedTime(null);setSubmitError(null);};
  const phoneLink = (phone: string) => `tel:${phone.replace(/[^+0-9]/g, '')}`;
  return <div className="space-y-4 text-ink-800">
    <ClinicPageHeader title="Εφημερία" description="Βρες εφημερεύοντα κτηνίατρο και επικοινωνήστε ή στείλε αίτημα επίσκεψης." />
    <div role="note" className="rounded-xl bg-[#ffe0c7] px-4 py-3 text-sm leading-6 text-[#622700]">Για επείγον περιστατικό, κάλεσε το κτηνιατρείο πριν μεταβείς. Το ηλεκτρονικό αίτημα χρειάζεται επιβεβαίωση και δεν εξασφαλίζει άμεση εξυπηρέτηση.</div>
    <ol aria-label="Βήματα εφημερίας" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{['Κτηνίατρος','Κατοικίδια & ανάγκη','Ώρα & αίτημα','Αποστολή'].map((label,i)=><li key={label} aria-current={step===i+1?'step':undefined} className={`rounded-[10px] border px-3 py-2.5 text-xs ${step===i+1?'border-clinic-200 bg-clinic-50 font-semibold text-clinic-800':'border-ink-200 bg-white text-ink-500'}`}>{i+1}. {label}</li>)}</ol>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-ink-200 bg-white">
        {step===1&&<>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-4 py-3"><div><h2 className="text-sm font-semibold">Εφημερεύοντα κτηνιατρεία</h2><p className="mt-1 text-xs text-ink-500">{filteredVets.length} αποτελέσματα · Επιβεβαιώστε τηλεφωνικά τη διαθεσιμότητα.</p></div><ClinicButton aria-pressed={showMap} onClick={()=>setShowMap(v=>!v)}>{showMap?'Απόκρυψη χάρτη':'Προβολή χάρτη'}</ClinicButton></div>
          <div className="grid gap-3 border-b border-ink-200 p-4 sm:grid-cols-2"><ClinicInput aria-label="Αναζήτηση κτηνιάτρου" placeholder="Όνομα, περιοχή ή διεύθυνση…" value={search} onChange={e=>setSearch(e.target.value)}/><ClinicSelect aria-label="Πόλη" value={city} onChange={e=>setCity(e.target.value)}><option value="">Όλες οι πόλεις</option>{Array.from(new Set(vets.map(v=>v.city).filter(Boolean))).sort().map(c=><option key={c}>{c}</option>)}</ClinicSelect></div>
          {showMap&&<div className="relative z-0 h-72 border-b border-ink-200"><OnCallMap vets={mapMarkers} selectedVetId={selectedVet} onSelectVet={chooseVet}/></div>}
          {vetsLoading&&!vets.length?<ClinicLoading/>:vetsError?<ErrorBlock message="Δεν φορτώθηκαν οι εφημερίες." onRetry={refetchVets} />:!filteredVets.length?<div className="p-8 text-center"><h3 className="text-sm font-semibold">{vets.length?'Δεν βρέθηκαν κτηνίατροι με αυτά τα φίλτρα':'Δεν εμφανίζονται εφημερεύοντα κτηνιατρεία'}</h3><p className="mt-2 text-sm text-ink-500">{vets.length?'Δοκιμάστε άλλη περιοχή ή αναζήτηση.':'Επικοινωνήστε τηλεφωνικά με κτηνιατρείο της περιοχής σας.'}</p><ClinicButton className="mt-3" onClick={()=>{setSearch('');setCity('');void refetchVets();}}>Ανανέωση αποτελεσμάτων</ClinicButton></div>:filteredVets.map(v=><article key={v.id} aria-label={v.name} className={`border-b border-ink-100 p-4 sm:p-5 ${selectedVet===v.id?'bg-clinic-50/60':''}`}>
            <div className="flex items-start gap-3"><ClinicAvatar large name={v.name} imageUrl={v.image_url}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words text-sm font-semibold text-ink-900">{v.name}</h3><span className="inline-flex h-5 items-center rounded-full bg-clinic-100 px-2 text-xs font-medium text-clinic-800">{selectedVet===v.id?'Επιλεγμένος':'Εφημερία'}</span></div><p className="mt-1 text-xs text-ink-500">{v.specialty}</p><p className="mt-2 break-words text-sm text-ink-600">{[v.address,v.city].filter(Boolean).join(', ')||'Δεν έχει καταχωριστεί διεύθυνση'}</p><p className="mt-2 text-xs text-ink-500">{v.reviews_count?`★ ${Number(v.rating_average).toFixed(1)} · ${v.reviews_count} αξιολογήσεις`:'Χωρίς αξιολογήσεις ακόμη'}</p></div></div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><ClinicButton className="min-h-10" variant={selectedVet===v.id?'primary':'secondary'} aria-pressed={selectedVet===v.id} onClick={()=>chooseVet(v.id)}>{selectedVet===v.id?'Επιλεγμένος':'Επιλογή κτηνιάτρου'}</ClinicButton>{v.phone&&<a className={linkSecondary} href={phoneLink(v.phone)}>Κλήση {v.phone}</a>}<ClinicButton variant="ghost" className="min-h-10" onClick={()=>setDetails(v)}>Στοιχεία & τοποθεσία</ClinicButton></div>
          </article>)}
        </>}
        {step===2&&<div className="space-y-6 p-4 sm:p-5"><div><h2 className="text-sm font-semibold">Ποιο κατοικίδιο χρειάζεται φροντίδα;</h2><p className="mt-1 text-xs text-ink-500">Μπορείτε να επιλέξετε έως 10 κατοικίδια.</p></div>{petsLoading?<ClinicLoading/>:petsError?<ErrorBlock message="Δεν φορτώθηκαν τα κατοικίδια." onRetry={refetchPets} />:!pets.length?<Link href="/owner/pets" className={linkSecondary}>Προσθέστε κατοικίδιο για να στείλετε αίτημα</Link>:<div className="grid gap-2 sm:grid-cols-2">{pets.map(p=><button key={p.id} aria-pressed={selectedPets.has(p.id)} disabled={!selectedPets.has(p.id)&&selectedPets.size>=10} onClick={()=>setSelectedPets(prev=>{const next=new Set(prev);next.has(p.id)?next.delete(p.id):next.add(p.id);return next;})} className={`flex min-h-14 items-center gap-3 rounded-[10px] border p-3 text-left disabled:opacity-50 ${selectedPets.has(p.id)?'border-clinic-400 bg-clinic-50':'border-ink-200 hover:bg-ink-50'}`}><ClinicAvatar name={p.name} imageUrl={p.image_url}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="text-xs text-ink-500">{p.breed||p.type}</span></span><span aria-hidden="true">{selectedPets.has(p.id)?'✓':'+'}</span></button>)}</div>}<ClinicPagination page={petPage} totalPages={petPages} onPageChange={setPetPage}/><label className="block text-sm font-medium">Τύπος περιστατικού<ClinicSelect className="mt-2 w-full" value={emergencyType} onChange={e=>setEmergencyType(e.target.value)}><option value="">Επιλέξτε τον λόγο επίσκεψης</option>{emergencyTypes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</ClinicSelect></label></div>}
        {step===3&&<div className="space-y-5 p-4 sm:p-5"><h2 className="text-sm font-semibold">Ημερομηνία και διαθέσιμη ώρα</h2><fieldset disabled={submitting} className="min-w-0 space-y-5"><CalendarPicker value={selectedDate} onChange={setSelectedDate} minDate={new Date()} maxDate={maxDate} accentColor="indigo"/>{selectedDate&&(slotsLoading?<ClinicLoading label="Έλεγχος διαθεσιμότητας…"/>:slotsError?<ErrorBlock message="Δεν φορτώθηκαν οι ώρες." onRetry={refetchSlots} />:availableSlots.length?<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{availableSlots.map(time=><ClinicButton key={time} className="min-h-10 tabular-nums" aria-pressed={time===selectedTime} variant={time===selectedTime?'primary':'secondary'} onClick={()=>setSelectedTime(time)}>{time}</ClinicButton>)}</div>:<p className="rounded-[10px] bg-ink-50 p-4 text-sm text-ink-600">Δεν υπάρχουν διαθέσιμες ώρες. Επιλέξτε άλλη ημερομηνία ή επικοινωνήστε με το κτηνιατρείο.</p>)}<label className="block text-sm font-medium">Σημειώσεις (προαιρετικό)<ClinicTextarea className="mt-2 w-full" rows={4} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Περιγράψτε σύντομα τον λόγο επίσκεψης…"/></label></fieldset>{submitError&&<p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}{!selectedVetData&&<p role="alert" className="text-sm text-amber-800">Ο κτηνίατρος δεν εμφανίζεται πλέον στις εφημερίες. Επιστρέψτε στην επιλογή κτηνιάτρου.</p>}</div>}
        {step===4&&<div className="p-5 sm:p-8"><span className="inline-flex h-5 items-center rounded-full bg-clinic-100 px-2 text-xs font-medium text-clinic-800">Αποστολή αιτήματος</span><h2 className="mt-4 text-xl font-semibold tracking-tight">{selectedPets.size>1?'Τα αιτήματά σας στάλθηκαν':'Το αίτημά σας στάλθηκε'}</h2><p className="mt-3 text-sm leading-6 text-ink-600">Αναμένεται επιβεβαίωση από το κτηνιατρείο. Για άμεση ανάγκη, επικοινωνήστε τηλεφωνικά.</p><Link href="/owner/appointments" className={`${linkPrimary} mt-5`}>Δες τα ραντεβού σου</Link></div>}
        {step<4&&<div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 p-4"><ClinicButton className="min-h-10" disabled={step===1||submitting} onClick={()=>setStep(s=>Math.max(1,s-1) as Step)}>Πίσω</ClinicButton><ClinicButton variant="primary" className="min-h-10" disabled={!canProceed()||submitting||(step===3&&(!selectedVetData||!!vetsError))} onClick={handleNext}>{submitting?'Αποστολή…':step===3?'Αποστολή αιτήματος':'Συνέχεια'}</ClinicButton></div>}
      </section>
      <aside aria-label="Σύνοψη αιτήματος" className="min-w-0 rounded-xl border border-ink-200 bg-white p-4 sm:p-5 xl:sticky xl:top-24"><h2 className="border-b border-ink-100 pb-3 text-sm font-semibold">{step===4?'Το αίτημά σας':'Η επιλογή σας'}</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-ink-500">Κτηνίατρος</dt><dd className="mt-1 break-words font-medium">{selectedVetData?.name||'Δεν έχει επιλεγεί'}</dd>{selectedVetData?.phone&&<dd className="mt-2"><a href={phoneLink(selectedVetData.phone)} className="text-clinic-700 underline">{selectedVetData.phone}</a></dd>}</div><div><dt className="text-xs text-ink-500">Κατοικίδια</dt><dd className="mt-1 break-words">{Array.from(selectedPets).map(id=>petCache[id]?.name||'Κατοικίδιο').join(', ')||'Δεν έχουν επιλεγεί'}</dd></div><div><dt className="text-xs text-ink-500">Περιστατικό</dt><dd className="mt-1">{emergencyType||'Δεν έχει επιλεγεί'}</dd></div><div><dt className="text-xs text-ink-500">Ημερομηνία & ώρα</dt><dd className="mt-1">{selectedDate?new Date(selectedDate+'T00:00:00').toLocaleDateString('el-GR'):'Δεν έχει επιλεγεί'}{selectedTime?` · ${selectedTime}`:''}</dd></div></dl>{step>1&&step<4&&<ClinicButton className="mt-5 min-h-10 w-full" disabled={submitting} onClick={()=>setStep(1)}>Αλλαγή κτηνιάτρου</ClinicButton>}</aside>
    </div>
    {details&&<ClinicDrawer label="Στοιχεία κτηνιάτρου" onClose={()=>setDetails(null)}><div className="space-y-5 p-5"><div className="flex justify-end"><ClinicButton variant="ghost" className="min-h-10" onClick={()=>setDetails(null)} aria-label="Κλείσιμο">Κλείσιμο ×</ClinicButton></div><ClinicAvatar large name={details.name} imageUrl={details.image_url}/><h2 className="break-words text-lg font-semibold">{details.name}</h2><p className="text-sm text-ink-500">{details.specialty}</p><dl className="space-y-4 border-y border-ink-200 py-4 text-sm"><div><dt className="text-ink-500">Διεύθυνση</dt><dd className="mt-1 break-words">{[details.address,details.city].filter(Boolean).join(', ')||'Δεν έχει καταχωριστεί'}</dd></div><div><dt className="text-ink-500">Τηλέφωνο</dt><dd className="mt-1">{details.phone?<a className="text-clinic-700 underline" href={phoneLink(details.phone)}>{details.phone}</a>:'Δεν έχει καταχωριστεί'}</dd></div></dl><div className="flex flex-wrap gap-2"><ClinicButton variant="primary" className="min-h-10" onClick={()=>{chooseVet(details.id);setDetails(null);}}>Επιλογή κτηνιάτρου</ClinicButton>{(details.address||details.city)&&<a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([details.address,details.city].filter(Boolean).join(', '))}`} className={linkSecondary}>Οδηγίες διαδρομής ↗</a>}</div><p className="text-xs leading-5 text-ink-500">Η ένδειξη εφημερίας προέρχεται από το κτηνιατρείο. Καλέστε πριν μεταβείτε.</p></div></ClinicDrawer>}
  </div>;
}
