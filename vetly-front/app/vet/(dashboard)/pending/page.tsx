'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  usePendingAppointments,
  approveAppointment,
  rejectAppointment,
  usePatient,
  usePatientHistory,
  VetAppointment,
} from '@/hooks/useVetData';
import { getImageUrl } from '@/lib/api';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatHistoryDate(dateStr: string): string {
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

export default function VetPendingPage() {
  const { appointments, loading, error, refetch } = usePendingAppointments();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Group appointments by group_id
  const grouped = useMemo(() => {
    const groups: VetAppointment[][] = [];
    const groupMap = new Map<string, VetAppointment[]>();
    for (const apt of appointments) {
      if (apt.group_id) {
        if (!groupMap.has(apt.group_id)) {
          const arr: VetAppointment[] = [];
          groupMap.set(apt.group_id, arr);
          groups.push(arr);
        }
        groupMap.get(apt.group_id)!.push(apt);
      } else {
        groups.push([apt]);
      }
    }
    return groups;
  }, [appointments]);

  const { patient: selectedPatient, loading: patientLoading } = usePatient(selectedPetId);
  const { events: history, loading: historyLoading } = usePatientHistory(selectedPetId);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await approveAppointment(id);
      await refetch();
    } catch {
      // silently fail — user sees no change
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await rejectAppointment(id);
      await refetch();
    } catch {
      // silently fail
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">Παρακαλώ δοκιμάστε ξανά αργότερα.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          &larr; Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Αιτήματα Ραντεβού</h1>
        <p className="text-slate-500 mt-1">{appointments.length} εκκρεμή αιτήματα</p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Όλα ενημερωμένα!</h3>
          <p className="text-slate-500">Δεν υπάρχουν εκκρεμή αιτήματα ραντεβού.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => {
            const isGroup = group.length > 1;
            const first = group[0];
            const ownerName = first.pet_owner?.name || 'Ιδιοκτήτης';
            const isProcessing = group.some(a => processingId === a.id);

            if (!isGroup) {
              // Single appointment — render as before
              const apt = first;
              const petName = apt.pet?.name || 'Κατοικίδιο';
              const isSelected = selectedPetId === apt.pet_id;

              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedPetId(apt.pet_id)}
                  className={`bg-white rounded-2xl shadow-sm border p-5 relative overflow-hidden cursor-pointer transition-all ${
                    isProcessing ? 'opacity-50 pointer-events-none' : ''
                  } ${
                    isSelected
                      ? 'border-indigo-300 bg-indigo-50/30'
                      : 'border-amber-100 hover:border-amber-200'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${isSelected ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                        {petName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">
                          {petName}{' '}
                          <span className="text-slate-400 font-normal text-sm">({ownerName})</span>
                        </h4>
                        <p className="text-slate-600">{apt.type}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(apt.scheduled_at)}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(apt.scheduled_at)}
                          </span>
                        </div>
                        {apt.notes && <p className="text-sm text-slate-500 mt-2 italic">&ldquo;{apt.notes}&rdquo;</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleReject(apt.id, e)}
                        disabled={isProcessing}
                        className="px-4 py-2 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Απόρριψη
                      </button>
                      <button
                        onClick={(e) => handleApprove(apt.id, e)}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Έγκριση
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Grouped appointment — multiple pets in one card
            const groupKey = first.group_id || first.id;

            return (
              <div
                key={groupKey}
                className={`bg-white rounded-2xl shadow-sm border border-amber-100 p-5 relative overflow-hidden transition-all ${
                  isProcessing ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                {/* Group header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                        {group.length} κατοικίδια
                      </span>
                      <span className="text-slate-400 text-sm">({ownerName})</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(first.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(first.scheduled_at)}
                      </span>
                    </div>
                    {first.notes && <p className="text-sm text-slate-500 mt-2 italic">&ldquo;{first.notes}&rdquo;</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReject(first.id, e); }}
                      disabled={isProcessing}
                      className="px-4 py-2 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Απόρριψη Όλων
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(first.id, e); }}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Έγκριση Όλων
                    </button>
                  </div>
                </div>

                {/* Individual pets */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {group.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedPetId(apt.pet_id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedPetId === apt.pet_id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                        {(apt.pet?.name || '?').charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">{apt.pet?.name || 'Κατοικίδιο'}</span>
                        <span className="text-sm text-slate-500 ml-2">{apt.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pet Detail Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          selectedPetId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPetId && (
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div
              className="h-40 relative bg-slate-100"
              style={selectedPatient?.cover_image_url ? {
                backgroundImage: `url(${getImageUrl(selectedPatient.cover_image_url)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {selectedPatient?.cover_image_url && (
                <div className="absolute inset-0 bg-black/20" />
              )}
              <button
                onClick={() => setSelectedPetId(null)}
                className={`absolute top-4 left-4 z-10 backdrop-blur-md p-2 rounded-full transition-colors ${
                  selectedPatient?.cover_image_url
                    ? 'bg-white/20 text-white hover:bg-white/40'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className={`absolute bottom-4 left-4 z-10 ${selectedPatient?.cover_image_url ? 'text-white' : 'text-slate-800'}`}>
                {patientLoading ? (
                  <div className="animate-pulse h-8 w-32 bg-slate-200 rounded" />
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{selectedPatient?.name || ''}</h2>
                    <p className={`text-sm ${selectedPatient?.cover_image_url ? 'text-white/90' : 'text-slate-500'}`}>
                      {selectedPatient?.breed || ''}
                    </p>
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
                      <span className="text-slate-800 font-bold text-lg">
                        <GenderLabel gender={selectedPatient.gender} />
                      </span>
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
                          <div className="text-indigo-700/70 text-xs">
                            {selectedPatient.owner.phone || selectedPatient.owner.email}
                          </div>
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
                                <span className="text-xs text-slate-400">{formatHistoryDate(record.date)}</span>
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
    </div>
  );
}
