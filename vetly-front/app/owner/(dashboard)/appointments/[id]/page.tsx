'use client';

import { use } from 'react';
import Link from 'next/link';
import { useAppointmentDetail } from '@/hooks/useOwnerData';
import { getImageUrl } from '@/lib/api';

const appointmentTypeLabels: Record<string, string> = {
  'Checkup': 'Εξέταση',
  'Vaccination': 'Εμβολιασμός',
  'Surgery': 'Χειρουργείο',
  'Emergency': 'Εκτακτη Ανάγκη',
  'Dental': 'Οδοντιατρικά',
  'Grooming': 'Καλλωπισμός',
  'Consultation': 'Συμβουλευτική',
  'Follow-up': 'Επανεξέταση',
  'Deworming': 'Αποπαρασίτωση',
  'Lab Tests': 'Εργαστηριακές Εξετάσεις',
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: 'Επιβεβαιωμένο', bg: 'bg-green-100', text: 'text-green-700' },
  pending: { label: 'Αναμονή', bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { label: 'Ολοκληρώθηκε', bg: 'bg-slate-100', text: 'text-slate-600' },
  cancelled: { label: 'Ακυρώθηκε', bg: 'bg-red-100', text: 'text-red-700' },
};

const eventTypeLabels: Record<string, string> = {
  'Vaccination': 'Εμβολιασμός',
  'Surgery': 'Χειρουργείο',
  'Checkup': 'Εξέταση',
  'Lab Test': 'Εργαστηριακή Εξέταση',
  'Diagnosis': 'Διάγνωση',
  'Treatment': 'Θεραπεία',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    weekday: 'long',
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

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const frequencyLabels: Record<string, string> = {
  daily: 'Καθημερινά',
  weekly: 'Εβδομαδιαία',
  once: 'Εφάπαξ',
};

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { appointment, loading, error } = useAppointmentDetail(id);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="h-4 bg-slate-200 rounded w-32 animate-pulse mb-4" />
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse mb-2" />
          <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          <div className="space-y-4">
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/owner/appointments" className="text-teal-600 font-bold text-sm hover:text-teal-700 mb-4 block">
          &larr; Πίσω στα ραντεβού
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error || 'Δεν βρέθηκε το ραντεβού.'}</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[appointment.status] || statusConfig.pending;
  const petName = appointment.pet?.name || 'Κατοικίδιο';
  const petImage = getImageUrl(appointment.pet?.image_url);
  const vetName = appointment.vet?.name || 'Κτηνίατρος';
  const vetSpecialty = appointment.vet?.specialty || '';
  const vetImage = getImageUrl(appointment.vet?.image_url);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/owner/appointments" className="text-teal-600 font-bold text-sm hover:text-teal-700 mb-6 block">
        &larr; Πίσω στα ραντεβού
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">
            {appointmentTypeLabels[appointment.type] || appointment.type}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <p className="text-slate-500">
          {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}
          {appointment.duration_minutes && ` - ${appointment.duration_minutes} λεπτά`}
        </p>
      </div>

      <div className="space-y-6">
        {/* Pet Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Κατοικίδιο</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-teal-50 flex items-center justify-center">
              {petImage ? (
                <img src={petImage} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-teal-600 font-bold text-xl">{petName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{petName}</h3>
              <p className="text-sm text-slate-500">
                {appointment.pet?.type || ''}
                {appointment.pet?.breed ? ` - ${appointment.pet.breed}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Vet Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Κτηνίατρος</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-teal-50 flex items-center justify-center">
              {vetImage ? (
                <img src={vetImage} alt={vetName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-teal-600 font-bold text-xl">{vetName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{vetName}</h3>
              {vetSpecialty && <p className="text-sm text-slate-500">{vetSpecialty}</p>}
              {appointment.vet?.address && (
                <p className="text-sm text-slate-400 mt-1">
                  {appointment.vet.address}{appointment.vet.city ? `, ${appointment.vet.city}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-3">Σημειώσεις</h2>
            <p className="text-slate-700">{appointment.notes}</p>
          </div>
        )}

        {/* Price */}
        {appointment.price && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-3">Κόστος</h2>
            <p className="text-2xl font-bold text-slate-900">{Number(appointment.price).toFixed(2)} &euro;</p>
          </div>
        )}

        {/* Medical Events */}
        {appointment.medical_events.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Ιατρικό Ιστορικό</h2>
            <div className="space-y-3">
              {appointment.medical_events.map((event) => (
                <div key={event.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800">{event.title}</h4>
                      <span className="text-xs font-bold text-teal-600">
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{formatShortDate(event.date)}</span>
                  </div>
                  {event.notes && <p className="text-sm text-slate-600 mt-2">{event.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {appointment.medications.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Φαρμακευτική Αγωγή</h2>
            <div className="space-y-3">
              {appointment.medications.map((med) => (
                <div key={med.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800">{med.name}</h4>
                      <p className="text-sm text-slate-500">{med.dosage} - {frequencyLabels[med.frequency] || med.frequency}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${med.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {med.is_active ? 'Ενεργό' : 'Ανενεργό'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400 mt-1">
                    <span>Από: {formatShortDate(med.start_date)}</span>
                    {med.end_date && <span>Έως: {formatShortDate(med.end_date)}</span>}
                  </div>
                  {med.notes && <p className="text-sm text-slate-600 mt-2">{med.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
