'use client';

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

const APPOINTMENT_TYPES = [
  'Εξέταση',
  'Εμβολιασμός',
  'Χειρουργείο',
  'Οδοντιατρικός Έλεγχος',
  'Ακτινογραφία',
  'Άλλο',
];

const DURATION_OPTIONS = [15, 30, 45, 60];

function petEmoji(type: string) {
  if (type === 'Dog') return '🐕';
  if (type === 'Cat') return '🐈';
  return '🐾';
}

interface CreateAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAppointmentDialog({ open, onClose, onSuccess }: CreateAppointmentDialogProps) {
  const { user } = useAuth();
  const vetId = user?.id ?? null;

  // Client (owner) search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Selection state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedPet, setSelectedPet] = useState<LinkedPet | null>(null);

  // Form state
  const [appointmentType, setAppointmentType] = useState('Εξέταση');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data hooks
  const { clients, loading: clientsLoading } = useVetClients(1, 20, debouncedSearch || undefined);
  const { client: clientDetail, loading: clientDetailLoading } = useVetClient(selectedClientId);
  const { slots, loading: slotsLoading } = useVetAvailableSlots(vetId, selectedPet ? selectedDate : null);

  // Derived state
  const availablePets = clientDetail?.linked_pets ?? [];
  const isLinkedClient = clientDetail?.status === 'linked';
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
    setSelectedSlot(null);
  }, [selectedDate]);

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
    if (!selectedPet) {
      setError('Επιλέξτε κατοικίδιο');
      return;
    }
    if (!selectedDate) {
      setError('Επιλέξτε ημερομηνία');
      return;
    }
    if (!selectedSlot) {
      setError('Επιλέξτε ώρα');
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
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl p-6 text-white relative">
            <button
              onClick={onClose}
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
                <h2 className="text-xl font-bold">Νέο Ραντεβού</h2>
                <p className="text-white/70 text-sm mt-0.5">Προγραμματίστε ραντεβού για κατοικίδιο</p>
              </div>
            </div>
          </div>

          {/* Body — all fields always visible */}
          <div className="p-6 space-y-5">
            {/* Row 1: Client + Pet side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client (Owner) Search */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Κάτοχος <span className="text-red-500">*</span>
                </label>

                {selectedClientId ? (
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {selectedClientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-indigo-900 text-sm truncate">{selectedClientName}</p>
                      {clientDetail && (
                        <p className="text-xs text-indigo-600 truncate">
                          {clientDetail.email || clientDetail.phone || ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleClearClient}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors p-0.5 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Αναζήτηση κατόχου..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800"
                      />
                      {clientsLoading && searchTerm.length >= 2 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                        </div>
                      )}
                    </div>

                    {showDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto"
                      >
                        {clients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectClient(c)}
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-indigo-50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 last:border-b-0"
                          >
                            <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-base shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800">{c.name}</p>
                              <p className="text-sm text-slate-500 truncate mt-0.5">
                                {c.email || c.phone || ''}
                                {c.pet_count > 0 && ` · ${c.pet_count} κατοικίδια`}
                              </p>
                            </div>
                            {c.status === 'linked' && (
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">Vetly</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pet Selection */}
              <div className={!hasClient ? disabledInput : ''}>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Κατοικίδιο <span className="text-red-500">*</span>
                </label>

                {!hasClient ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Επιλέξτε πρώτα κάτοχο
                  </div>
                ) : clientDetailLoading ? (
                  <div className="flex items-center justify-center py-3 rounded-xl border border-slate-200">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                  </div>
                ) : !isLinkedClient ? (
                  <div className="px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-amber-700 text-sm font-medium">Δεν έχει λογαριασμό Vetly</p>
                    <p className="text-amber-600 text-xs mt-0.5">Στείλτε πρόσκληση πρώτα</p>
                  </div>
                ) : availablePets.length === 0 ? (
                  <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <p className="text-slate-400 text-sm">Δεν υπάρχουν κατοικίδια</p>
                  </div>
                ) : availablePets.length === 1 ? (
                  // Auto-select single pet, show as selected chip
                  (() => {
                    const pet = availablePets[0];
                    if (!selectedPet) setSelectedPet(pet);
                    return (
                      <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                        <span className="text-xl">{petEmoji(pet.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-indigo-900 text-sm">{pet.name}</p>
                          <p className="text-xs text-indigo-600">{pet.breed || pet.type}</p>
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
                            ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-lg">{petEmoji(pet.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${selectedPet?.id === pet.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {pet.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {pet.breed || pet.type}
                            {pet.age != null && ` · ${pet.age} ετών`}
                          </p>
                        </div>
                        {selectedPet?.id === pet.id && (
                          <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Τύπος <span className="text-red-500">*</span>
                </label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  disabled={!hasPet}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Διάρκεια
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={!hasPet}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d} λεπτά</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Date + Time side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className={!hasPet ? disabledInput : ''}>
                <label className="block text-sm font-bold text-slate-700 mb-2">
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
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Ώρα <span className="text-red-500">*</span>
                </label>

                {!selectedDate ? (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <p className="text-slate-400 text-sm">Επιλέξτε ημερομηνία</p>
                  </div>
                ) : slotsLoading ? (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-slate-200">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-2 py-2 rounded-lg text-sm font-bold transition-all ${
                          selectedSlot === slot
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <p className="text-slate-400 text-sm">Δεν υπάρχουν διαθέσιμα slots</p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Notes */}
            <div className={!hasPet ? disabledInput : ''}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Σημειώσεις
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!hasPet}
                placeholder="Σημειώσεις (προαιρετικό)..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 resize-none disabled:bg-slate-50 disabled:text-slate-400"
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !selectedPet}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
