'use client';


import ClinicDrawer from './ClinicDrawer';
import { ClinicButton, ClinicInput, ClinicPanel, ClinicSelect, ClinicTextarea } from '@/components/vet/ClinicUI';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useVetClients,
  useVetClient,
  useVetAvailableSlots,
  createVetAppointment,
  VetClientListItem,
  LinkedPet,
} from '@/hooks/useVetData';
import CalendarPicker from '@/components/CalendarPicker';
import { getImageUrl } from '@/lib/api';

const APPOINTMENT_TYPES = [
  'Εξέταση',
  'Εμβολιασμός',
  'Χειρουργείο',
  'Οδοντιατρικός Έλεγχος',
  'Ακτινογραφία',
  'Άλλο',
];

const DURATION_OPTIONS = [15, 30, 45, 60];

interface CreateAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  embedded?: boolean;
  initialClient?: { id: string; name: string };
  initialDate?: string;
  initialTime?: string;
}

export default function CreateAppointmentDialog({ open, onClose, onSuccess, embedded = false, initialDate, initialTime, initialClient }: CreateAppointmentDialogProps) {
  const { user } = useAuth();
  const vetId = user?.id ?? null;

  // Client (owner) search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Selection state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClient?.id || null);
  const [selectedClientName, setSelectedClientName] = useState(initialClient?.name || '');
  const [selectedPet, setSelectedPet] = useState<LinkedPet | null>(null);

  // Form state
  const [appointmentType, setAppointmentType] = useState('Εξέταση');
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate || null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialTime || null);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data hooks
  const { clients, loading: clientsLoading } = useVetClients(1, 20, debouncedSearch || undefined);
  const { client: clientDetail, loading: clientDetailLoading } = useVetClient(selectedClientId);
  const { slots, loading: slotsLoading } = useVetAvailableSlots(vetId, selectedPet ? selectedDate : null, duration);

  // Derived state
  const availablePets = clientDetail?.linked_pets ?? [];
  const hasClient = !!selectedClientId;
  const hasPet = !!selectedPet;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Show dropdown when results exist
  useEffect(() => {
    if (debouncedSearch.length >= 2 && clients.length > 0 && !selectedClientId) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [debouncedSearch, clients, selectedClientId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset slot when date changes
  useEffect(() => {
    setSelectedSlot(selectedDate === initialDate && duration === 30 ? initialTime || null : null);
  }, [selectedDate, duration, initialDate, initialTime]);

  // Reset pet when client changes
  useEffect(() => {
    setSelectedPet(null);
  }, [selectedClientId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setDebouncedSearch('');
      setSelectedClientId(null);
      setSelectedClientName('');
      setSelectedPet(null);
      setAppointmentType('Εξέταση');
      setSelectedDate(null);
      setSelectedSlot(null);
      setDuration(30);
      setNotes('');
      setError(null);
    }
  }, [open]);

  const handleSelectClient = (client: VetClientListItem) => {
    setSelectedClientId(client.id);
    setSelectedClientName(client.name);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClearClient = () => {
    setSelectedClientId(null);
    setSelectedClientName('');
    setSelectedPet(null);
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!selectedPet) {
      setError('Επιλέξτε κατοικίδιο');
      return;
    }
    if (!selectedDate) {
      setError('Επιλέξτε ημερομηνία');
      return;
    }
    if (!selectedSlot || slotsLoading || !slots.includes(selectedSlot)) {
      setError('Επιλέξτε διαθέσιμη ώρα για τον ασθενή και τη διάρκεια.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createVetAppointment({
        pet_id: selectedPet.id,
        scheduled_at: `${selectedDate}T${selectedSlot}:00`,
        type: appointmentType,
        duration_minutes: duration,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία δημιουργίας ραντεβού');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const disabledInput = 'opacity-50 pointer-events-none';

  return (
    <ClinicDrawer label="Νέο ραντεβού" embedded={embedded} busy={submitting} onClose={onClose}>
        <div className={embedded ? 'bg-white rounded-xl border border-ink-200 overflow-hidden' : 'bg-white w-full'} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="border-b border-ink-200 p-5 relative [&_span]:text-ink-600 [&_p]:text-ink-500 [&_button]:text-ink-700">
            <button
              onClick={onClose} disabled={submitting} aria-label="Κλείσιμο φόρμας"
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Νέο Ραντεβού</h2>
                <p className="text-white/70 text-sm mt-0.5">Προγραμματίστε ραντεβού για κατοικίδιο</p>
              </div>
            </div>
          </div>

          {/* Body — all fields always visible */}
          <div className="p-6 space-y-5">
            {/* Row 1: Client + Pet side by side */}
            <div className={embedded ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
              {/* Client (Owner) Search */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Κάτοχος <span className="text-red-500">*</span>
                </label>

                {selectedClientId ? (
                  <div className="flex items-center gap-3 bg-clinic-50 border border-clinic-200 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 bg-clinic-200 rounded-full flex items-center justify-center text-clinic-700 font-semibold text-sm shrink-0">
                      {selectedClientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-clinic-900 text-sm truncate">{selectedClientName}</p>
                      {clientDetail && (
                        <p className="text-xs text-clinic-600 truncate">
                          {clientDetail.email || clientDetail.phone || ''}
                        </p>
                      )}
                    </div>
                    <ClinicButton variant="ghost"
                      onClick={handleClearClient}
                      className="shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </ClinicButton>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <ClinicInput
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Αναζήτηση κατόχου..."
                        className="w-full pl-12 pr-4 py-3"
                      />
                      {clientsLoading && searchTerm.length >= 2 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-clinic-600" />
                        </div>
                      )}
                    </div>

                    {showDropdown && (
                      <ClinicPanel
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-2 max-h-80 overflow-y-auto"
                      >
                        {clients.map((c) => (
                          <ClinicButton variant="secondary"
                            key={c.id}
                            onClick={() => handleSelectClient(c)}
                            className="w-full text-left"
                          >
                            <div className="w-11 h-11 bg-ink-100 rounded-full flex items-center justify-center text-ink-600 font-semibold text-base shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink-800">{c.name}</p>
                              <p className="text-sm text-ink-500 truncate mt-0.5">
                                {c.email || c.phone || ''}
                                {c.pet_count > 0 && ` · ${c.pet_count} κατοικίδια`}
                              </p>
                            </div>
                            {c.status === 'linked' && (
                              <span className="text-xs font-semibold text-clinic-600 bg-clinic-50 px-2.5 py-1 rounded-full shrink-0">Vetly</span>
                            )}
                          </ClinicButton>
                        ))}
                      </ClinicPanel>
                    )}
                  </div>
                )}
              </div>

              {/* Pet Selection */}
              <div className={!hasClient ? disabledInput : ''}>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Κατοικίδιο <span className="text-red-500">*</span>
                </label>

                {!hasClient ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-200 bg-ink-50 text-ink-400 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Επιλέξτε πρώτα κάτοχο
                  </div>
                ) : clientDetailLoading ? (
                  <div className="flex items-center justify-center py-3 rounded-xl border border-ink-200">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-clinic-600" />
                  </div>
                ) : availablePets.length === 0 ? (
                  <div className="px-4 py-3 rounded-xl border border-dashed border-ink-200 bg-ink-50">
                    <p className="text-ink-400 text-sm">Δεν υπάρχουν κατοικίδια. Προσθέστε ένα από την καρτέλα πελάτη.</p>
                  </div>
                ) : availablePets.length === 1 ? (
                  // Auto-select single pet, show as selected chip
                  (() => {
                    const pet = availablePets[0];
                    if (!selectedPet) setSelectedPet(pet);
                    return (
                      <div className="flex items-center gap-3 bg-clinic-50 border border-clinic-200 rounded-xl px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-clinic-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {pet.image_url ? (
                            <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-clinic-900 text-sm">{pet.name}</p>
                          <p className="text-xs text-clinic-600">{pet.breed || pet.type}</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-1.5">
                    {availablePets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(selectedPet?.id === pet.id ? null : pet)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                          selectedPet?.id === pet.id
                            ? 'bg-clinic-50 border-clinic-300 ring-2 ring-clinic-200'
                            : 'bg-white border-ink-200 hover:bg-ink-50 hover:border-ink-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-clinic-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {pet.image_url ? (
                            <img src={getImageUrl(pet.image_url)} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${selectedPet?.id === pet.id ? 'text-clinic-900' : 'text-ink-800'}`}>
                            {pet.name}
                          </p>
                          <p className="text-xs text-ink-500 truncate">
                            {pet.breed || pet.type}
                            {pet.age != null && ` · ${pet.age} ετών`}
                          </p>
                        </div>
                        {selectedPet?.id === pet.id && (
                          <svg className="w-5 h-5 text-clinic-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Type + Duration */}
            <div className={`grid grid-cols-2 gap-4 ${!hasPet ? disabledInput : ''}`}>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Τύπος <span className="text-red-500">*</span>
                </label>
                <ClinicSelect
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  disabled={!hasPet}
                  className="w-full px-4 py-3"
                >
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </ClinicSelect>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Διάρκεια
                </label>
                <ClinicSelect
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={!hasPet}
                  className="w-full px-4 py-3"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d} λεπτά</option>
                  ))}
                </ClinicSelect>
              </div>
            </div>

            {/* Row 3: Date + Time side by side */}
            <div className={embedded ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
              {/* Date Picker */}
              <div className={!hasPet ? disabledInput : ''}>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Ημερομηνία <span className="text-red-500">*</span>
                </label>
                <CalendarPicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  accentColor="indigo"
                  minDate={new Date()}
                />
              </div>

              {/* Time Slots */}
              <div className={!hasPet ? disabledInput : ''}>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Ώρα <span className="text-red-500">*</span>
                </label>

                {!selectedDate ? (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-ink-200 bg-ink-50">
                    <p className="text-ink-400 text-sm">Επιλέξτε ημερομηνία</p>
                  </div>
                ) : slotsLoading ? (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-ink-200">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-clinic-600" />
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                          selectedSlot === slot
                            ? 'bg-clinic-600 text-white shadow-sm'
                            : 'bg-ink-50 text-ink-700 border border-ink-200 hover:bg-clinic-50 hover:border-clinic-200 hover:text-clinic-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-ink-200 bg-ink-50">
                    <p className="text-ink-400 text-sm">Δεν υπάρχουν διαθέσιμα slots</p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Notes */}
            <div className={!hasPet ? disabledInput : ''}>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Σημειώσεις
              </label>
              <ClinicTextarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!hasPet}
                placeholder="Σημειώσεις (προαιρετικό)..."
                rows={2}
                className="w-full px-4 py-3 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <ClinicButton variant="secondary"
                type="button"
                onClick={onClose} disabled={submitting}
                className="flex-1"
              >
                Ακύρωση
              </ClinicButton>
              <ClinicButton variant="primary"
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !selectedPet}
                className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Δημιουργία...
                  </span>
                ) : (
                  'Δημιουργία Ραντεβού'
                )}
              </ClinicButton>
            </div>
          </div>
        </div>
    </ClinicDrawer>
  );
}
