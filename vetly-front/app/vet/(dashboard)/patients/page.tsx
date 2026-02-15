'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  usePatients,
  usePatient,
  usePatientHistory,
  useVetProfile,
  useVetAvailableSlots,
  createVetAppointment,
  type Patient,
} from '@/hooks/useVetData';
import CalendarPicker from '@/components/CalendarPicker';

const appointmentTypes = [
  { id: 'Checkup', name: 'Γενικός Έλεγχος', icon: '🩺' },
  { id: 'Vaccination', name: 'Εμβολιασμός', icon: '💉' },
  { id: 'Dental Cleaning', name: 'Οδοντιατρικά', icon: '🦷' },
  { id: 'Emergency', name: 'Επείγον', icon: '🚨' },
  { id: 'Surgery', name: 'Χειρουργείο', icon: '🏥' },
  { id: 'Grooming', name: 'Περιποίηση', icon: '✂️' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function GenderLabel({ gender }: { gender: string }) {
  const labels: Record<string, string> = { Male: '♂', Female: '♀' };
  return <>{labels[gender] || gender}</>;
}

function PetTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = { Dog: 'Σκύλος', Cat: 'Γάτα', Other: 'Άλλο' };
  return <>{labels[type] || type}</>;
}

function BookAppointmentDialog({
  patient,
  vetId,
  onClose,
}: {
  patient: Patient;
  vetId: string;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { slots: availableSlots, loading: slotsLoading } = useVetAvailableSlots(vetId, selectedDate);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  const canSubmit = selectedType && selectedDate && selectedTime && !submitting;

  const handleSubmit = async () => {
    if (!selectedType || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await createVetAppointment({
        pet_id: patient.id,
        scheduled_at: `${selectedDate}T${selectedTime}:00`,
        type: selectedType,
        duration_minutes: 30,
        notes: notes || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Αποτυχία δημιουργίας ραντεβού');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-lg font-bold">Νέο Ραντεβού</h2>
              <p className="text-white/80 text-sm">{patient.name} - {patient.breed}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Το ραντεβού δημιουργήθηκε!</h3>
            <p className="text-slate-500 text-sm mb-6">Το ραντεβού επιβεβαιώθηκε αυτόματα.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Κλείσιμο
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Appointment Type */}
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-3">Τύπος ραντεβού</h3>
              <div className="grid grid-cols-3 gap-2">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedType === type.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-xl block mb-1">{type.icon}</span>
                    <p className="font-medium text-slate-800 text-xs">{type.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-3">Ημερομηνία</h3>
              <CalendarPicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                maxDate={maxDate}
                accentColor="indigo"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-3">Ώρα</h3>
                {slotsLoading ? (
                  <div className="text-center py-6 text-slate-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto mb-2" />
                    <span className="text-xs">Φόρτωση διαθέσιμων ωρών...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    <p className="font-medium">Δεν υπάρχουν διαθέσιμες ώρες</p>
                    <p className="text-xs mt-1">Δοκιμάστε διαφορετική ημερομηνία.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                          selectedTime === time
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-100 hover:border-indigo-200 text-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-3">Σημειώσεις (προαιρετικό)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Προσθέστε σημειώσεις για το ραντεβού..."
                rows={2}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Αποστολή...
                  </>
                ) : (
                  'Δημιουργία'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VetPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebouncedSearch(value), 300));
  };

  const { patients, loading, error } = usePatients(debouncedSearch || undefined);
  const { patient: selectedPatient, loading: patientLoading } = usePatient(selectedPetId);
  const { events: history, loading: historyLoading } = usePatientHistory(selectedPetId);
  const { profile: vetProfile } = useVetProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Διαχείριση Ασθενών</h1>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Αναζήτηση με όνομα κατοικιδίου..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-5 font-bold">Ασθενής</th>
                <th className="p-5 font-bold">Ιδιοκτήτης</th>
                <th className="p-5 font-bold">Είδος</th>
                <th className="p-5 font-bold">Ηλικία</th>
                <th className="p-5 font-bold text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {patients.map(patient => (
                <tr
                  key={patient.id}
                  onClick={() => setSelectedPetId(patient.id)}
                  className={`border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 cursor-pointer transition-colors ${
                    selectedPetId === patient.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                        {patient.image_url ? (
                          <img src={patient.image_url} alt={patient.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-slate-500 font-bold">{patient.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{patient.name}</div>
                        <div className="text-slate-500 text-xs">{patient.breed}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="font-medium text-slate-800">{patient.owner?.name || '-'}</div>
                    <div className="text-slate-400 text-xs">{patient.owner?.phone || ''}</div>
                  </td>
                  <td className="p-5 text-slate-600"><PetTypeLabel type={patient.type} /></td>
                  <td className="p-5 text-slate-600 font-medium">{patient.age} Ετών</td>
                  <td className="p-5 text-right">
                    <button className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {patients.length === 0 && (
          <div className="p-12 text-center text-slate-400">Δεν βρέθηκαν ασθενείς.</div>
        )}
      </div>

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedPetId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPetId && (
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="h-40 relative bg-gradient-to-br from-indigo-500 to-indigo-600">
              <button
                onClick={() => setSelectedPetId(null)}
                className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-4 text-white">
                {patientLoading ? (
                  <div className="animate-pulse h-8 w-32 bg-white/20 rounded" />
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{selectedPatient?.name || ''}</h2>
                    <p className="text-white/90 text-sm">{selectedPatient?.breed || ''}</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {patientLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                </div>
              ) : selectedPatient ? (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                      <span className="block text-slate-400 text-xs font-bold uppercase">Ηλικία</span>
                      <span className="text-slate-800 font-bold text-lg">{selectedPatient.age}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                      <span className="block text-slate-400 text-xs font-bold uppercase">Βάρος</span>
                      <span className="text-slate-800 font-bold text-lg">{selectedPatient.weight}kg</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                      <span className="block text-slate-400 text-xs font-bold uppercase">Φύλο</span>
                      <span className="text-slate-800 font-bold text-lg"><GenderLabel gender={selectedPatient.gender} /></span>
                    </div>
                  </div>

                  {/* Chip */}
                  {selectedPatient.chip_number && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Microchip</span>
                      <span className="font-mono text-slate-700 font-medium text-sm">{selectedPatient.chip_number}</span>
                    </div>
                  )}

                  {/* Owner */}
                  {selectedPatient.owner && (
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase mb-2">Ιδιοκτήτης</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-indigo-900 text-sm">{selectedPatient.owner.name}</div>
                          <div className="text-indigo-700/70 text-xs">{selectedPatient.owner.phone || selectedPatient.owner.email}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* History */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Ιστορικό</h3>
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-slate-100 ml-2 space-y-4">
                        {history.map((record) => (
                          <div key={record.id} className="relative pl-5">
                            <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-indigo-100 border-2 border-indigo-500" />
                            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-800 text-sm">{record.title}</span>
                                <span className="text-xs text-slate-400">{formatDate(record.date)}</span>
                              </div>
                              <p className="text-xs text-indigo-600 font-medium mb-1">{record.event_type}</p>
                              {record.notes && <p className="text-xs text-slate-600">{record.notes}</p>}
                            </div>
                          </div>
                        ))}
                        {history.length === 0 && (
                          <div className="pl-5 text-slate-400 italic text-sm">Δεν βρέθηκε ιστορικό.</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 mt-auto">
              <button
                onClick={() => setShowBookDialog(true)}
                disabled={!selectedPatient}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Νέο Ραντεβού
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {selectedPetId && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSelectedPetId(null)}
        />
      )}

      {/* Book Appointment Dialog */}
      {showBookDialog && selectedPatient && vetProfile && (
        <BookAppointmentDialog
          patient={selectedPatient}
          vetId={vetProfile.id}
          onClose={() => setShowBookDialog(false)}
        />
      )}
    </div>
  );
}
