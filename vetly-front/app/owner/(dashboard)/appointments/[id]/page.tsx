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
  confirmed: { label: 'Επιβεβαιωμένο', bg: 'bg-clinic-100', text: 'text-clinic-800' },
  pending: { label: 'Αναμονή', bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { label: 'Ολοκληρώθηκε', bg: 'bg-ink-100', text: 'text-ink-600' },
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
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-6">
          <div className="h-4 bg-ink-200 rounded w-32 animate-pulse mb-4" />
          <div className="h-8 bg-ink-200 rounded w-64 animate-pulse mb-2" />
          <div className="h-4 bg-ink-200 rounded w-48 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200 animate-pulse">
          <div className="space-y-4">
            <div className="h-20 bg-ink-100 rounded-xl" />
            <div className="h-20 bg-ink-100 rounded-xl" />
            <div className="h-20 bg-ink-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-[1000px] mx-auto">
        <Link href="/owner/appointments" className="text-clinic-600 font-medium text-sm hover:text-clinic-700 mb-4 block">
          &larr; Πίσω στα ραντεβού
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
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
    <div className="max-w-[1000px] mx-auto">
      {/* Back link */}
      <Link href="/owner/appointments" className="text-clinic-600 font-medium text-sm hover:text-clinic-700 mb-6 block">
        &larr; Πίσω στα ραντεβού
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-xl font-medium text-ink-900">
            {appointmentTypeLabels[appointment.type] || appointment.type}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <p className="text-ink-500">
          {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}
          {appointment.duration_minutes && ` - ${appointment.duration_minutes} λεπτά`}
        </p>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-2">
        {/* Pet Info */}
        <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200">
          <h2 className="text-sm font-medium text-ink-600 mb-4">Κατοικίδιο</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-ink-100 flex-shrink-0 bg-clinic-50 flex items-center justify-center">
              {petImage ? (
                <img src={petImage} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-clinic-600 font-medium text-xl">{petName.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 break-words">
              <h3 className="font-medium text-ink-900 text-lg">{petName}</h3>
              <p className="text-sm text-ink-500">
                {appointment.pet?.type || ''}
                {appointment.pet?.breed ? ` - ${appointment.pet.breed}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Vet Info */}
        <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200">
          <h2 className="text-sm font-medium text-ink-600 mb-4">Κτηνίατρος</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-ink-100 flex-shrink-0 bg-clinic-50 flex items-center justify-center">
              {vetImage ? (
                <img src={vetImage} alt={vetName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-clinic-600 font-medium text-xl">{vetName.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 break-words">
              <h3 className="font-medium text-ink-900 text-lg">{vetName}</h3>
              {vetSpecialty && <p className="text-sm text-ink-500">{vetSpecialty}</p>}
              {appointment.vet?.address && (
                <p className="text-sm text-ink-400 mt-1">
                  {appointment.vet.address}{appointment.vet.city ? `, ${appointment.vet.city}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200">
            <h2 className="text-sm font-medium text-ink-600 mb-3">Σημειώσεις</h2>
            <p className="break-words text-ink-700">{appointment.notes}</p>
          </div>
        )}

        {/* Price */}
        {appointment.price != null && (
          <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200">
            <h2 className="text-sm font-medium text-ink-600 mb-3">Κόστος</h2>
            <p className="text-2xl font-medium text-ink-900">{Number(appointment.price).toFixed(2)} &euro;</p>
          </div>
        )}

        {/* Medical Events */}
        {appointment.medical_events.length > 0 && (
          <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200">
            <h2 className="text-sm font-medium text-ink-600 mb-4">Ιατρικό Ιστορικό</h2>
            <div className="space-y-3">
              {appointment.medical_events.map((event) => (
                <div key={event.id} className="bg-ink-50 rounded-xl p-4 border border-ink-100">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-medium text-ink-800">{event.title}</h4>
                      <span className="text-xs font-medium text-clinic-600">
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                    </div>
                    <span className="text-xs text-ink-400">{formatShortDate(event.date)}</span>
                  </div>
                  {event.notes && <p className="text-sm text-ink-600 mt-2">{event.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {appointment.medications.length > 0 && (
          <div className="bg-white rounded-xl min-w-0 p-5 shadow-xs border border-ink-200">
            <h2 className="text-sm font-medium text-ink-600 mb-4">Φαρμακευτική Αγωγή</h2>
            <div className="space-y-3">
              {appointment.medications.map((med) => (
                <div key={med.id} className="bg-ink-50 rounded-xl p-4 border border-ink-100">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-medium text-ink-800">{med.name}</h4>
                      <p className="text-sm text-ink-500">{med.dosage} - {frequencyLabels[med.frequency] || med.frequency}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${med.is_active ? 'bg-clinic-100 text-clinic-800' : 'bg-ink-100 text-ink-500'}`}>
                      {med.is_active ? 'Ενεργό' : 'Ανενεργό'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-ink-400 mt-1">
                    <span>Από: {formatShortDate(med.start_date)}</span>
                    {med.end_date && <span>Έως: {formatShortDate(med.end_date)}</span>}
                  </div>
                  {med.notes && <p className="text-sm text-ink-600 mt-2">{med.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
