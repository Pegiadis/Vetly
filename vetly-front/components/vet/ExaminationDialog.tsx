'use client';

import { useState, useEffect, useRef } from 'react';
import {
  completeExamination,
  createReminder,
  getCustomDiagnosisTypes,
  updateCustomDiagnosisTypes,
  getCustomReminderTypes,
  updateCustomReminderTypes,
  VetAppointment,
  ExaminationMedication,
} from '@/hooks/useVetData';
import DatePicker from '@/components/DatePicker';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const emptyMedication: ExaminationMedication = {
  name: '',
  dosage: '',
  frequency: 'daily',
  duration_days: undefined,
  notes: '',
};

export default function ExaminationDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: VetAppointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [medications, setMedications] = useState<ExaminationMedication[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom diagnosis types
  const [customDiagnosisTypes, setCustomDiagnosisTypes] = useState<string[]>([]);
  const [diagnosisDropdownOpen, setDiagnosisDropdownOpen] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [newDiagnosisName, setNewDiagnosisName] = useState('');
  const [editingDiagnosisIndex, setEditingDiagnosisIndex] = useState<number | null>(null);
  const [editingDiagnosisName, setEditingDiagnosisName] = useState('');
  const diagnosisDropdownRef = useRef<HTMLDivElement>(null);

  // Reminder state (optional)
  const [addReminder, setAddReminder] = useState(false);
  const [reminderType, setReminderType] = useState('checkup');
  const [reminderDueDate, setReminderDueDate] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(14);
  const [customReminderTypes, setCustomReminderTypes] = useState<string[]>([]);
  const [reminderTypeDropdownOpen, setReminderTypeDropdownOpen] = useState(false);
  const [showAddReminderType, setShowAddReminderType] = useState(false);
  const [newReminderTypeName, setNewReminderTypeName] = useState('');
  const reminderTypeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCustomDiagnosisTypes().then(setCustomDiagnosisTypes).catch(() => {});
    getCustomReminderTypes().then(setCustomReminderTypes).catch(() => {});
  }, []);

  // Close reminder type dropdown on click outside
  useEffect(() => {
    function handleReminderTypeClickOutside(e: MouseEvent) {
      if (reminderTypeDropdownRef.current && !reminderTypeDropdownRef.current.contains(e.target as Node)) {
        setReminderTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleReminderTypeClickOutside);
    return () => document.removeEventListener('mousedown', handleReminderTypeClickOutside);
  }, []);

  // Close diagnosis dropdown on click outside
  useEffect(() => {
    function handleDiagClickOutside(e: MouseEvent) {
      if (diagnosisDropdownRef.current && !diagnosisDropdownRef.current.contains(e.target as Node)) {
        setDiagnosisDropdownOpen(false);
        setEditingDiagnosisIndex(null);
      }
    }
    document.addEventListener('mousedown', handleDiagClickOutside);
    return () => document.removeEventListener('mousedown', handleDiagClickOutside);
  }, []);

  const addMedication = () => {
    setMedications([...medications, { ...emptyMedication }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof ExaminationMedication, value: string | number | undefined) => {
    setMedications(medications.map((med, i) => i === index ? { ...med, [field]: value } : med));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      setError('Η διάγνωση είναι υποχρεωτική');
      return;
    }

    for (let i = 0; i < medications.length; i++) {
      if (!medications[i].name.trim() || !medications[i].dosage.trim()) {
        setError(`Το φάρμακο #${i + 1} χρειάζεται όνομα και δοσολογία`);
        return;
      }
    }

    if (addReminder && !reminderDueDate) {
      setError('Επιλέξτε ημερομηνία για την υπενθύμιση');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await completeExamination(appointment.id, {
        diagnosis: diagnosis.trim(),
        examination_notes: examinationNotes.trim() || undefined,
        medications,
      });
      if (addReminder && reminderDueDate) {
        await createReminder({
          pet_id: appointment.pet_id,
          type: reminderType,
          message: reminderMessage.trim() || undefined,
          due_date: reminderDueDate,
          reminder_days_before: reminderDaysBefore,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία υποβολής');
    } finally {
      setSubmitting(false);
    }
  };

  const timeStr = formatTime(appointment.scheduled_at);
  const dateStr = formatDate(appointment.scheduled_at);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-2xl p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Ολοκλήρωση Εξέτασης</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{appointment.pet?.type === 'Dog' ? '🐕' : appointment.pet?.type === 'Cat' ? '🐈' : '🐾'}</span>
                <span className="font-bold">{appointment.pet?.name || 'Ασθενής'}</span>
                {appointment.pet?.breed && <span className="text-white/70 text-sm">{appointment.pet.breed}</span>}
              </div>
              <span className="text-white/60">|</span>
              <span className="text-white/80 text-sm">{dateStr}, {timeStr}</span>
            </div>
            {appointment.pet_owner && (
              <p className="text-white/70 text-sm mt-1">Ιδιοκτήτης: {appointment.pet_owner.name}</p>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Διάγνωση <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1" ref={diagnosisDropdownRef}>
                  <button
                    type="button"
                    onClick={() => { setDiagnosisDropdownOpen(!diagnosisDropdownOpen); setEditingDiagnosisIndex(null); }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm hover:border-slate-300 transition-colors"
                  >
                    <span className={diagnosis ? 'text-slate-800' : 'text-slate-400'}>{diagnosis || 'Επιλέξτε διάγνωση...'}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${diagnosisDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {diagnosisDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
                      {customDiagnosisTypes.length === 0 && !showAddDiagnosis && (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">
                          Δεν υπάρχουν διαγνώσεις — πατήστε + για προσθήκη
                        </div>
                      )}
                      {customDiagnosisTypes.map((dt, idx) => (
                        <div key={idx} className="group relative">
                          {editingDiagnosisIndex === idx ? (
                            <div className="flex items-center gap-1.5 px-3 py-2">
                              <input
                                type="text"
                                value={editingDiagnosisName}
                                onChange={(e) => setEditingDiagnosisName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const trimmed = editingDiagnosisName.trim();
                                    if (!trimmed) return;
                                    const updated = customDiagnosisTypes.map((t, i) => i === idx ? trimmed : t);
                                    setCustomDiagnosisTypes(updated);
                                    updateCustomDiagnosisTypes(updated).catch(() => {});
                                    if (diagnosis === dt) setDiagnosis(trimmed);
                                    setEditingDiagnosisIndex(null);
                                  }
                                  if (e.key === 'Escape') setEditingDiagnosisIndex(null);
                                }}
                                className="flex-1 border border-indigo-300 rounded-lg px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const trimmed = editingDiagnosisName.trim();
                                  if (!trimmed) return;
                                  const updated = customDiagnosisTypes.map((t, i) => i === idx ? trimmed : t);
                                  setCustomDiagnosisTypes(updated);
                                  updateCustomDiagnosisTypes(updated).catch(() => {});
                                  if (diagnosis === dt) setDiagnosis(trimmed);
                                  setEditingDiagnosisIndex(null);
                                }}
                                className="text-indigo-600 hover:text-indigo-700 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setDiagnosis(dt); setDiagnosisDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center ${diagnosis === dt ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                            >
                              <span className="flex-1">{dt}</span>
                              <span className="hidden group-hover:flex items-center gap-1">
                                <span
                                  role="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingDiagnosisIndex(idx); setEditingDiagnosisName(dt); }}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </span>
                                <span
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = customDiagnosisTypes.filter((_, i) => i !== idx);
                                    setCustomDiagnosisTypes(updated);
                                    updateCustomDiagnosisTypes(updated).catch(() => {});
                                    if (diagnosis === dt) setDiagnosis('');
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-0.5 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </span>
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                      {showAddDiagnosis && (
                        <div className="border-t border-slate-100 p-2">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newDiagnosisName}
                              onChange={(e) => setNewDiagnosisName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const trimmed = newDiagnosisName.trim();
                                  if (!trimmed) return;
                                  const updated = [...customDiagnosisTypes, trimmed];
                                  setCustomDiagnosisTypes(updated);
                                  updateCustomDiagnosisTypes(updated).catch(() => {});
                                  setDiagnosis(trimmed);
                                  setNewDiagnosisName('');
                                  setShowAddDiagnosis(false);
                                  setDiagnosisDropdownOpen(false);
                                }
                                if (e.key === 'Escape') setShowAddDiagnosis(false);
                              }}
                              placeholder="Νέα διάγνωση..."
                              className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = newDiagnosisName.trim();
                                if (!trimmed) return;
                                const updated = [...customDiagnosisTypes, trimmed];
                                setCustomDiagnosisTypes(updated);
                                updateCustomDiagnosisTypes(updated).catch(() => {});
                                setDiagnosis(trimmed);
                                setNewDiagnosisName('');
                                setShowAddDiagnosis(false);
                                setDiagnosisDropdownOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
                            >
                              Προσθήκη
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddDiagnosis(true); setDiagnosisDropdownOpen(true); }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shrink-0"
                  title="Προσθήκη νέας διάγνωσης"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Σημειώσεις Εξέτασης
              </label>
              <textarea
                value={examinationNotes}
                onChange={(e) => setExaminationNotes(e.target.value)}
                placeholder="Παρατηρήσεις, ευρήματα, οδηγίες..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-700">
                  Φαρμακευτική Αγωγή
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Προσθήκη Φαρμάκου
                </button>
              </div>

              {medications.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">Δεν έχουν προστεθεί φάρμακα</p>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="text-indigo-600 text-sm font-bold mt-1 hover:text-indigo-700"
                  >
                    + Προσθήκη πρώτου φαρμάκου
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-xs font-bold text-slate-400 mb-3">Φάρμακο #{index + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Όνομα *</label>
                        <input type="text" value={med.name} onChange={(e) => updateMedication(index, 'name', e.target.value)} placeholder="π.χ. Amoxicillin" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Δοσολογία *</label>
                        <input type="text" value={med.dosage} onChange={(e) => updateMedication(index, 'dosage', e.target.value)} placeholder="π.χ. 250mg" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Διάρκεια (ημέρες)</label>
                        <input type="number" value={med.duration_days ?? ''} onChange={(e) => updateMedication(index, 'duration_days', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="π.χ. 7" min={1} max={365} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-slate-500 mb-1 block">Σημειώσεις</label>
                      <input type="text" value={med.notes ?? ''} onChange={(e) => updateMedication(index, 'notes', e.target.value)} placeholder="π.χ. Μετά το φαγητό" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Reminder */}
            <div className="border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setAddReminder(!addReminder)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold text-slate-700">Προσθήκη Υπενθύμισης</span>
                  <span className="text-xs text-slate-400 font-normal">(προαιρετικό)</span>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${addReminder ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {addReminder && (
                <div className="p-4 space-y-4 border-t border-slate-200">
                  {/* Reminder Due Date — first so calendar drops down with room */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Ημερομηνία <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={reminderDueDate}
                      onChange={setReminderDueDate}
                      placeholder="Επιλέξτε ημερομηνία"
                    />
                  </div>

                  {/* Reminder Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Τύπος</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1" ref={reminderTypeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setReminderTypeDropdownOpen(!reminderTypeDropdownOpen)}
                          className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white hover:border-slate-300 transition-colors"
                        >
                          <span>{{ vaccination: 'Εμβολιασμός', checkup: 'Έλεγχος', medication: 'Φαρμακευτική Αγωγή', custom: 'Γενικό' }[reminderType] || reminderType}</span>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${reminderTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {reminderTypeDropdownOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            {[
                              { value: 'vaccination', label: 'Εμβολιασμός' },
                              { value: 'checkup', label: 'Έλεγχος' },
                              { value: 'medication', label: 'Φαρμακευτική Αγωγή' },
                              { value: 'custom', label: 'Γενικό' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setReminderType(opt.value); setReminderTypeDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors ${reminderType === opt.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                            {customReminderTypes.length > 0 && (
                              <div className="border-t border-slate-100">
                                {customReminderTypes.map((ct) => (
                                  <button
                                    key={ct}
                                    type="button"
                                    onClick={() => { setReminderType(ct); setReminderTypeDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors ${reminderType === ct ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                                  >
                                    {ct}
                                  </button>
                                ))}
                              </div>
                            )}
                            {showAddReminderType && (
                              <div className="border-t border-slate-100 p-2">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={newReminderTypeName}
                                    onChange={(e) => setNewReminderTypeName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const trimmed = newReminderTypeName.trim();
                                        if (!trimmed) return;
                                        const updated = [...customReminderTypes, trimmed];
                                        setCustomReminderTypes(updated);
                                        updateCustomReminderTypes(updated).catch(() => {});
                                        setReminderType(trimmed);
                                        setNewReminderTypeName('');
                                        setShowAddReminderType(false);
                                        setReminderTypeDropdownOpen(false);
                                      }
                                      if (e.key === 'Escape') setShowAddReminderType(false);
                                    }}
                                    placeholder="Νέος τύπος..."
                                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = newReminderTypeName.trim();
                                      if (!trimmed) return;
                                      const updated = [...customReminderTypes, trimmed];
                                      setCustomReminderTypes(updated);
                                      updateCustomReminderTypes(updated).catch(() => {});
                                      setReminderType(trimmed);
                                      setNewReminderTypeName('');
                                      setShowAddReminderType(false);
                                      setReminderTypeDropdownOpen(false);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
                                  >
                                    Προσθήκη
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowAddReminderType(true); setReminderTypeDropdownOpen(true); }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all shrink-0"
                        title="Προσθήκη νέου τύπου"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Days before */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Υπενθύμιση πριν (ημέρες)</label>
                    <input
                      type="number"
                      value={reminderDaysBefore}
                      onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                      min={1}
                      max={365}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Reminder Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Μήνυμα <span className="text-slate-400 font-normal">(προαιρετικό)</span></label>
                    <textarea
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                      rows={2}
                      placeholder="Σημειώσεις για τον ιδιοκτήτη..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Υποβολή...
                  </span>
                ) : (
                  'Ολοκλήρωση Εξέτασης'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
