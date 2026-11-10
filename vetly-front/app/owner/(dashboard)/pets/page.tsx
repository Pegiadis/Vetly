'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  useMyPets,
  useMyAppointments,
  useDeletedPets,
  createPet,
  updatePet,
  deletePet,
  restorePet,
  uploadPetPhoto,
  uploadPetCover,
  Pet,
} from '@/hooks/useOwnerData';
import type { Appointment } from '@/hooks/useOwnerData';
import { getImageUrl, ApiError } from '@/lib/api';
import { ClinicButton, ClinicPanel, ClinicPageHeader, ClinicPagination, ClinicLoading, ClinicInput, ClinicSelect, ClinicEmptyState } from '@/components/vet/ClinicUI';
import ClinicAvatar from '@/components/vet/ClinicAvatar';
import ClinicDrawer from '@/components/vet/ClinicDrawer';
import { ErrorBlock, InlineAlert, DrawerHeader, Field, Fact, athensNow, formatDay, speciesLabels, linkPrimary, linkSecondary } from '@/components/owner/OwnerUI';

const genderLabels: Record<string, string> = { Male: 'Αρσενικό', Female: 'Θηλυκό' };

function getLastVisit(petId: string, appointments: Appointment[]): string | null {
  const past = appointments
    .filter(a => a.pet_id === petId && a.status === 'completed')
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  return past.length ? formatDay(past[0].scheduled_at) : null;
}

function getNextAppointment(petId: string, appointments: Appointment[]): string | null {
  const now = athensNow();
  const upcoming = appointments
    .filter(a => a.pet_id === petId && (a.status === 'confirmed' || a.status === 'pending') && a.scheduled_at >= now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  return upcoming.length ? `${formatDay(upcoming[0].scheduled_at)} · ${upcoming[0].scheduled_at.slice(11, 16)}` : null;
}

const CHIP_REGEX = /^\d{15}$/;
function isChipValid(value: string): boolean {
  return value === '' || CHIP_REGEX.test(value);
}

const EMPTY_FORM = {
  name: '',
  type: 'Dog',
  breed: '',
  age: '',
  weight: '',
  gender: 'Male',
  chip_number: '',
};

const invalid = 'border-red-400!';

export default function PetsPage() {
  const [page, setPage] = useState(1);
  const { pets, total, totalPages, loading, error, refetch } = useMyPets(page, 6);
  const { appointments } = useMyAppointments(1, 100);
  const { pets: deletedPets, loading: deletedLoading, refetch: refetchDeleted } = useDeletedPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Create drawer
  const [showCreate, setShowCreate] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedPetId(params.get('selected'));
    if (params.get('action') === 'new') setShowCreate(true);
  }, []);

  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createTouched, setCreateTouched] = useState<Record<string, boolean>>({});

  // Edit drawer
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editForm, setEditForm] = useState({ name: '', breed: '', age: '', weight: '', chip_number: '' });
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    petId: string;
    petName: string;
    confirmText: string;
    isDeleting: boolean;
  } | null>(null);

  // Pet photo upload
  const petPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [actionError, setActionError] = useState('');

  const handlePetPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) return;
    setUploadingPhoto(true);
    setUploadError('');
    try {
      await uploadPetPhoto(selectedPet.id, file);
      refetch();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Αποτυχία μεταφόρτωσης φωτογραφίας.');
    } finally {
      setUploadingPhoto(false);
      if (petPhotoRef.current) petPhotoRef.current.value = '';
    }
  };

  // Cover photo upload
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) return;
    setUploadingCover(true);
    setUploadError('');
    try {
      await uploadPetCover(selectedPet.id, file);
      refetch();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Αποτυχία μεταφόρτωσης φωτογραφίας.');
    } finally {
      setUploadingCover(false);
      if (coverPhotoRef.current) coverPhotoRef.current.value = '';
    }
  };

  const selectedPet = useMemo(() => {
    if (pets.length === 0) return null;
    if (selectedPetId) return pets.find(p => p.id === selectedPetId) || pets[0];
    return pets[0];
  }, [pets, selectedPetId]);

  const handleCreate = async () => {
    if (submitting || !createForm.name || !createForm.breed || !createForm.age || !createForm.weight) return;
    setSubmitting(true);
    setFormError('');
    try {
      await createPet({
        name: createForm.name,
        type: createForm.type,
        breed: createForm.breed,
        age: parseInt(createForm.age),
        weight: parseFloat(createForm.weight),
        gender: createForm.gender,
        chip_number: createForm.chip_number || undefined,
      });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create form validation
  const createFieldErrors: Record<string, string> = {};
  if (createForm.name.length > 0 && createForm.name.trim().length < 2) createFieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (createForm.breed.length > 0 && createForm.breed.trim().length < 2) createFieldErrors.breed = 'Τουλάχιστον 2 χαρακτήρες.';
  const createFieldError = (field: string) => createTouched[field] ? createFieldErrors[field] : undefined;

  // Edit form validation
  const editFieldErrors: Record<string, string> = {};
  if (editForm.name.length > 0 && editForm.name.trim().length < 2) editFieldErrors.name = 'Τουλάχιστον 2 χαρακτήρες.';
  if (editForm.breed.length > 0 && editForm.breed.trim().length < 2) editFieldErrors.breed = 'Τουλάχιστον 2 χαρακτήρες.';
  const editFieldError = (field: string) => editTouched[field] ? editFieldErrors[field] : undefined;

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setEditTouched({});
    setEditForm({
      name: (pet.name || '').slice(0, 30),
      breed: (pet.breed || '').slice(0, 100),
      age: pet.age != null ? String(pet.age) : '',
      weight: pet.weight != null ? String(pet.weight) : '',
      chip_number: pet.chip_number || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingPet || submitting) return;
    setSubmitting(true);
    setFormError('');
    try {
      await updatePet(editingPet.id, {
        name: editForm.name || undefined,
        breed: editForm.breed || undefined,
        age: editForm.age ? parseInt(editForm.age) : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
        chip_number: editForm.chip_number || undefined,
      });
      setEditingPet(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (petId: string, petName: string) => {
    setDeleteDialog({ petId, petName, confirmText: '', isDeleting: false });
  };

  const confirmDelete = async () => {
    if (!deleteDialog || deleteDialog.confirmText !== deleteDialog.petName) return;
    setDeleteDialog(prev => prev ? { ...prev, isDeleting: true } : null);
    try {
      await deletePet(deleteDialog.petId);
      if (selectedPetId === deleteDialog.petId) setSelectedPetId(null);
      setDeleteDialog(null);
      if (page > 1 && pets.length === 1) setPage(page - 1);
      else refetch();
      refetchDeleted();
    } catch {
      setActionError('Δεν έγινε η διαγραφή. Δοκίμασε ξανά.');
      setDeleteDialog(prev => prev ? { ...prev, isDeleting: false } : null);
    }
  };

  const handleRestore = async (petId: string) => {
    setActionError('');
    setRestoringId(petId);
    try {
      await restorePet(petId);
      refetch();
      refetchDeleted();
    } catch {
      setActionError('Δεν έγινε η επαναφορά. Δοκίμασε ξανά.');
    } finally {
      setRestoringId(null);
    }
  };

  // On narrow screens the record sits below the list, so bring it into view after choosing a pet.
  const choosePet = (id: string) => {
    setSelectedPetId(id);
    setUploadError('');
    if (window.matchMedia('(max-width: 1279px)').matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const openCreate = () => { setCreateForm(EMPTY_FORM); setCreateTouched({}); setFormError(''); setShowCreate(true); };

  if (loading) return <ClinicLoading />;

  if (error) return <ClinicPanel><ErrorBlock onRetry={refetch} /></ClinicPanel>;

  const busyUpload = uploadingPhoto || uploadingCover;

  return (
    <div className="space-y-4 text-ink-800">
      <ClinicPageHeader title="Τα κατοικίδιά μου" description="Τα στοιχεία, οι φωτογραφίες και η φροντίδα τους, σε ένα σημείο." actions={<><ClinicButton className="min-h-10" onClick={() => setShowDeleted(!showDeleted)} aria-pressed={showDeleted}>Διαγραμμένα ({deletedPets.length})</ClinicButton><ClinicButton variant="primary" className="min-h-10" onClick={openCreate}>+ Προσθήκη κατοικιδίου</ClinicButton></>} />
      {actionError && <div role="alert" className="rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
      {showDeleted && <ClinicPanel className="overflow-hidden">
        <div className="border-b border-ink-100 px-4 py-3"><h2 className="text-sm font-semibold text-ink-900">Διαγραμμένα κατοικίδια</h2><p className="mt-1 text-xs leading-5 text-ink-500">Μπορείς να τα επαναφέρεις εντός 30 ημερών από τη διαγραφή.</p></div>
        {deletedLoading ? <ClinicLoading /> : deletedPets.length ? deletedPets.map(pet => <div key={pet.id} className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0"><div className="flex min-w-0 items-center gap-3"><ClinicAvatar name={pet.name} imageUrl={pet.image_url} /><p className="break-words text-sm font-medium">{pet.name}</p></div><ClinicButton className="min-h-10 shrink-0" disabled={restoringId !== null} onClick={() => void handleRestore(pet.id)}>{restoringId === pet.id ? 'Επαναφορά…' : 'Επαναφορά'}</ClinicButton></div>) : <p className="px-4 py-5 text-sm text-ink-500">Δεν υπάρχουν διαγραμμένα κατοικίδια.</p>}
      </ClinicPanel>}
      {pets.length === 0 ? <ClinicPanel><ClinicEmptyState title={page > 1 ? 'Δεν υπάρχουν κατοικίδια σε αυτή τη σελίδα.' : 'Δεν έχεις προσθέσει κατοικίδιο ακόμη.'} description="Πρόσθεσε το κατοικίδιό σου για να οργανώσεις τη φροντίδα του.">{page > 1 ? <ClinicButton onClick={() => setPage(1)}>Πρώτη σελίδα</ClinicButton> : <ClinicButton variant="primary" className="min-h-10" onClick={openCreate}>+ Προσθήκη κατοικιδίου</ClinicButton>}</ClinicEmptyState></ClinicPanel> : <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-w-0">
          <ClinicPanel className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-2 border-b border-ink-100 px-4 py-3"><h2 className="text-sm font-semibold text-ink-900">Τα κατοικίδιά σου</h2><span className="text-xs tabular-nums text-ink-500">{total}</span></div>
            {pets.map(pet => <button key={pet.id} aria-label={`Επιλογή κατοικιδίου: ${pet.name}`} aria-pressed={selectedPet?.id === pet.id} disabled={busyUpload} onClick={() => choosePet(pet.id)} className={`flex min-h-14 w-full min-w-0 items-center gap-3 border-b border-ink-100 px-4 py-2.5 text-left last:border-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clinic-600 disabled:opacity-60 ${selectedPet?.id === pet.id ? 'bg-clinic-50' : 'bg-white hover:bg-ink-50'}`}><ClinicAvatar name={pet.name} imageUrl={pet.image_url} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pet.name}</p><p className="truncate text-xs text-ink-500">{speciesLabels[pet.type] || pet.type} · {pet.breed || 'Χωρίς καταχώριση ράτσας'}</p></div><span aria-hidden="true" className="text-ink-400">→</span></button>)}
          </ClinicPanel>
          <ClinicPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        {selectedPet && <div ref={detailRef} className="min-w-0 scroll-mt-4 space-y-4" aria-label={`Φάκελος: ${selectedPet.name}`}>
          <ClinicPanel className="overflow-hidden">
            {selectedPet.cover_image_url && <img src={getImageUrl(selectedPet.cover_image_url)} alt={`Εξώφυλλο ${selectedPet.name}`} className="h-32 w-full object-cover sm:h-44" />}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3"><ClinicAvatar large name={selectedPet.name} imageUrl={selectedPet.image_url} /><div className="min-w-0"><h2 className="break-words text-xl font-semibold tracking-tight text-ink-900">{selectedPet.name}</h2><p className="mt-1 break-words text-xs text-ink-500">{speciesLabels[selectedPet.type] || selectedPet.type} · {selectedPet.breed || 'Δεν έχει οριστεί ράτσα'}</p></div></div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <ClinicButton variant="primary" className="min-h-10" onClick={() => { setFormError(''); openEdit(selectedPet); }}>Επεξεργασία στοιχείων</ClinicButton>
                <ClinicButton className="min-h-10" disabled={busyUpload} onClick={() => petPhotoRef.current?.click()}>{uploadingPhoto ? 'Μεταφόρτωση…' : 'Αλλαγή φωτογραφίας'}</ClinicButton>
                <ClinicButton className="min-h-10" disabled={busyUpload} onClick={() => coverPhotoRef.current?.click()}>{uploadingCover ? 'Μεταφόρτωση…' : selectedPet.cover_image_url ? 'Αλλαγή εξωφύλλου' : 'Προσθήκη εξωφύλλου'}</ClinicButton>
              </div>
              <input ref={petPhotoRef} aria-label="Αρχείο φωτογραφίας κατοικιδίου" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePetPhoto} /><input ref={coverPhotoRef} aria-label="Αρχείο εξωφύλλου" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverPhoto} />
              {uploadError && <div className="mt-3"><InlineAlert>{uploadError}</InlineAlert></div>}
            </div>
            <div className="border-t border-ink-100 p-4 sm:p-5"><h3 className="mb-3 text-sm font-semibold text-ink-900">Στοιχεία ταυτότητας</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              <Fact label="Ηλικία">{selectedPet.age != null ? `${selectedPet.age} ετών` : 'Δεν έχει οριστεί'}</Fact>
              <Fact label="Βάρος">{selectedPet.weight != null ? `${selectedPet.weight} kg` : 'Δεν έχει οριστεί'}</Fact>
              <Fact label="Φύλο">{selectedPet.gender ? genderLabels[selectedPet.gender] || selectedPet.gender : 'Δεν έχει οριστεί'}</Fact>
              <Fact label="Microchip"><span className="break-all tabular-nums">{selectedPet.chip_number || 'Δεν έχει οριστεί'}</span></Fact>
            </dl></div>
          </ClinicPanel>
          <ClinicPanel className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-ink-900">Φροντίδα και επισκέψεις</h3>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <Fact label="Τελευταία ολοκληρωμένη επίσκεψη">{getLastVisit(selectedPet.id, appointments) || 'Δεν εμφανίζεται πρόσφατη επίσκεψη.'}</Fact>
              <Fact label="Επόμενο ραντεβού / αίτημα">{getNextAppointment(selectedPet.id, appointments) || 'Δεν εμφανίζεται επερχόμενο ραντεβού.'}</Fact>
            </dl>
            <p className="mt-3 text-xs text-ink-500">Από τα πρόσφατα ραντεβού του λογαριασμού. <Link href="/owner/appointments" className="font-medium text-clinic-700 underline-offset-4 hover:underline">Προβολή όλων</Link></p>
            <div className="mt-4 grid gap-2 border-t border-ink-100 pt-4 sm:flex sm:flex-wrap"><Link href="/owner/book" className={linkPrimary}>Κλείσε ραντεβού</Link><Link href="/owner/medical" className={linkSecondary}>Ιατρικό ιστορικό</Link><Link href="/owner/medications" className={linkSecondary}>Αγωγές</Link></div>
          </ClinicPanel>
          <div className="flex flex-wrap items-center justify-between gap-3 px-1"><p className="text-xs text-ink-500">Διαχείριση προφίλ κατοικιδίου</p><ClinicButton variant="danger" className="min-h-10" onClick={() => { setActionError(''); handleDelete(selectedPet.id, selectedPet.name); }}>Διαγραφή κατοικιδίου</ClinicButton></div>
        </div>}
      </div>}

      {/* Create pet */}
      {showCreate && (
        <ClinicDrawer label="Νέο κατοικίδιο" busy={submitting} onClose={() => { setShowCreate(false); setFormError(''); }}>
          <form className="w-full bg-white p-5" onSubmit={e => { e.preventDefault(); void handleCreate(); }}><fieldset disabled={submitting} className="min-w-0 space-y-4">
            <DrawerHeader title="Νέο κατοικίδιο" disabled={submitting} onClose={() => { setShowCreate(false); setFormError(''); }} />
            <Field label="Όνομα" error={createFieldError('name')}>
              <ClinicInput type="text" maxLength={30} aria-label="Όνομα" required value={createForm.name}
                onChange={e => { setCreateForm(prev => ({ ...prev, name: e.target.value })); setCreateTouched(t => ({ ...t, name: true })); }}
                onBlur={() => setCreateTouched(t => ({ ...t, name: true }))}
                className={`h-10 w-full ${createFieldError('name') ? invalid : ''}`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Τύπος"><ClinicSelect aria-label="Τύπος" value={createForm.type} onChange={e => setCreateForm(prev => ({ ...prev, type: e.target.value }))} className="h-10 w-full">
                {Object.entries(speciesLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </ClinicSelect></Field>
              <Field label="Φύλο"><ClinicSelect aria-label="Φύλο" value={createForm.gender} onChange={e => setCreateForm(prev => ({ ...prev, gender: e.target.value }))} className="h-10 w-full">
                <option value="Male">Αρσενικό</option>
                <option value="Female">Θηλυκό</option>
              </ClinicSelect></Field>
            </div>
            <Field label="Ράτσα" error={createFieldError('breed')}>
              <ClinicInput type="text" maxLength={100} aria-label="Ράτσα" required value={createForm.breed}
                onChange={e => { setCreateForm(prev => ({ ...prev, breed: e.target.value })); setCreateTouched(t => ({ ...t, breed: true })); }}
                onBlur={() => setCreateTouched(t => ({ ...t, breed: true }))}
                className={`h-10 w-full ${createFieldError('breed') ? invalid : ''}`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ηλικία (έτη)"><ClinicInput type="number" inputMode="numeric" min="0" max="50" aria-label="Ηλικία (έτη)" required value={createForm.age} onChange={e => setCreateForm(prev => ({ ...prev, age: e.target.value }))} className="h-10 w-full" /></Field>
              <Field label="Βάρος (kg)"><ClinicInput type="number" inputMode="decimal" min="0" step="0.1" aria-label="Βάρος (kg)" required value={createForm.weight} onChange={e => setCreateForm(prev => ({ ...prev, weight: e.target.value }))} className="h-10 w-full" /></Field>
            </div>
            <Field label="Microchip" hint="(προαιρετικό, 15 ψηφία)" error={!!createForm.chip_number && !isChipValid(createForm.chip_number) && 'Ο αριθμός microchip πρέπει να αποτελείται από ακριβώς 15 ψηφία.'}>
              <ClinicInput type="text" inputMode="numeric" maxLength={15} aria-label="Microchip" value={createForm.chip_number} onChange={e => setCreateForm(prev => ({ ...prev, chip_number: e.target.value }))} placeholder="15 ψηφία"
                className={`h-10 w-full ${createForm.chip_number && !isChipValid(createForm.chip_number) ? invalid : ''}`} />
            </Field>
            {formError && <InlineAlert>{formError}</InlineAlert>}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ClinicButton type="button" className="min-h-10" disabled={submitting} onClick={() => { setShowCreate(false); setFormError(''); }}>Ακύρωση</ClinicButton>
              <ClinicButton type="submit" variant="primary" className="min-h-10"
                disabled={submitting || !createForm.name || !createForm.breed || !createForm.age || !createForm.weight || !isChipValid(createForm.chip_number) || Object.keys(createFieldErrors).length > 0}>
                {submitting ? 'Αποθήκευση…' : 'Προσθήκη'}
              </ClinicButton>
            </div>
          </fieldset></form>
        </ClinicDrawer>
      )}

      {/* Edit pet */}
      {editingPet && (
        <ClinicDrawer label="Επεξεργασία κατοικιδίου" busy={submitting} onClose={() => { setEditingPet(null); setFormError(''); }}>
          <form className="w-full bg-white p-5" onSubmit={e => { e.preventDefault(); void handleUpdate(); }}><fieldset disabled={submitting} className="min-w-0 space-y-4">
            <DrawerHeader title={`Επεξεργασία: ${editingPet.name}`} disabled={submitting} onClose={() => { setEditingPet(null); setFormError(''); }} />
            <Field label="Όνομα" error={editFieldError('name')}>
              <ClinicInput type="text" maxLength={30} aria-label="Όνομα" value={editForm.name}
                onChange={e => { setEditForm(prev => ({ ...prev, name: e.target.value })); setEditTouched(t => ({ ...t, name: true })); }}
                onBlur={() => setEditTouched(t => ({ ...t, name: true }))}
                className={`h-10 w-full ${editFieldError('name') ? invalid : ''}`} />
            </Field>
            <Field label="Ράτσα" error={editFieldError('breed')}>
              <ClinicInput type="text" maxLength={100} aria-label="Ράτσα" value={editForm.breed}
                onChange={e => { setEditForm(prev => ({ ...prev, breed: e.target.value })); setEditTouched(t => ({ ...t, breed: true })); }}
                onBlur={() => setEditTouched(t => ({ ...t, breed: true }))}
                className={`h-10 w-full ${editFieldError('breed') ? invalid : ''}`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ηλικία (έτη)"><ClinicInput type="number" inputMode="numeric" min="0" max="50" aria-label="Ηλικία (έτη)" value={editForm.age} onChange={e => setEditForm(prev => ({ ...prev, age: e.target.value }))} className="h-10 w-full" /></Field>
              <Field label="Βάρος (kg)"><ClinicInput type="number" inputMode="decimal" min="0" step="0.1" aria-label="Βάρος (kg)" value={editForm.weight} onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))} className="h-10 w-full" /></Field>
            </div>
            <Field label="Microchip" hint="(15 ψηφία)" error={!!editForm.chip_number && !isChipValid(editForm.chip_number) && 'Ο αριθμός microchip πρέπει να αποτελείται από ακριβώς 15 ψηφία.'}>
              <ClinicInput type="text" inputMode="numeric" maxLength={15} aria-label="Microchip" value={editForm.chip_number} onChange={e => setEditForm(prev => ({ ...prev, chip_number: e.target.value }))} placeholder="15 ψηφία"
                className={`h-10 w-full ${editForm.chip_number && !isChipValid(editForm.chip_number) ? invalid : ''}`} />
            </Field>
            {formError && <InlineAlert>{formError}</InlineAlert>}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ClinicButton type="button" className="min-h-10" disabled={submitting} onClick={() => { setEditingPet(null); setFormError(''); }}>Ακύρωση</ClinicButton>
              <ClinicButton type="submit" variant="primary" className="min-h-10" disabled={submitting || !isChipValid(editForm.chip_number) || Object.keys(editFieldErrors).length > 0}>
                {submitting ? 'Αποθήκευση…' : 'Αποθήκευση'}
              </ClinicButton>
            </div>
          </fieldset></form>
        </ClinicDrawer>
      )}

      {/* Delete confirmation */}
      {deleteDialog && (
        <ClinicDrawer label="Διαγραφή κατοικιδίου" busy={deleteDialog.isDeleting} onClose={() => setDeleteDialog(null)}>
          <div className="w-full space-y-4 bg-white p-5">
            <DrawerHeader title="Διαγραφή κατοικιδίου" disabled={deleteDialog.isDeleting} onClose={() => setDeleteDialog(null)} />
            {actionError && <InlineAlert>{actionError}</InlineAlert>}
            <p className="rounded-[10px] bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              Μπορείς να επαναφέρεις το κατοικίδιο εντός 30 ημερών. Τα δεδομένα του (ιατρικό ιστορικό, ραντεβού, φάρμακα) θα διαγραφούν οριστικά μετά από 30 ημέρες.
            </p>
            <Field label={`Πληκτρολόγησε «${deleteDialog.petName}» για επιβεβαίωση`}>
              <ClinicInput type="text" value={deleteDialog.confirmText} onChange={e => setDeleteDialog(prev => prev ? { ...prev, confirmText: e.target.value } : null)} placeholder={deleteDialog.petName} autoFocus className="h-10 w-full" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <ClinicButton type="button" className="min-h-10" disabled={deleteDialog.isDeleting} onClick={() => setDeleteDialog(null)}>Ακύρωση</ClinicButton>
              <ClinicButton type="button" variant="danger" className="min-h-10" onClick={confirmDelete} disabled={deleteDialog.confirmText !== deleteDialog.petName || deleteDialog.isDeleting}>
                {deleteDialog.isDeleting ? 'Διαγραφή…' : 'Διαγραφή'}
              </ClinicButton>
            </div>
          </div>
        </ClinicDrawer>
      )}
    </div>
  );
}
