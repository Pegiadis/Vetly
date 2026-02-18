'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMyAppointments, cancelAppointment, rescheduleAppointment } from '@/hooks/useOwnerData';
import type { Appointment, AppointmentFilters } from '@/hooks/useOwnerData';
import { getImageUrl, ApiError } from '@/lib/api';
import Pagination from '@/components/Pagination';
import DatePicker from '@/components/DatePicker';

type TabType = 'upcoming' | 'past';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('el-GR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDatetimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    confirmed: 'Επιβεβαιωμένο',
    pending: 'Αναμονή',
    completed: 'Ολοκληρώθηκε',
    cancelled: 'Ακυρώθηκε',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

function CancelDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const petName = appointment.pet?.name || 'Κατοικίδιο';
  const vetName = appointment.vet?.name || 'Κτηνίατρος';

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await cancelAppointment(appointment.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Αποτυχία ακύρωσης');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Ακύρωση Ραντεβού</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτό το ραντεβού;
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-slate-700"><span className="font-bold">Κατοικίδιο:</span> {petName}</p>
              <p className="text-slate-700"><span className="font-bold">Κτηνίατρος:</span> {vetName}</p>
              <p className="text-slate-700"><span className="font-bold">Ημερομηνία:</span> {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</p>
            </div>

            <p className="text-xs text-red-500 text-center mb-4">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ακύρωση...
                  </span>
                ) : (
                  'Ακύρωση Ραντεβού'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RescheduleDialog({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newDate, setNewDate] = useState(toDatetimeLocal(appointment.scheduled_at));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const petName = appointment.pet?.name || 'Κατοικίδιο';
  const vetName = appointment.vet?.name || 'Κτηνίατρος';

  const isValid = newDate && new Date(newDate) > new Date();

  const handleReschedule = async () => {
    if (!isValid) return;
    try {
      setSubmitting(true);
      setError(null);
      await rescheduleAppointment(appointment.id, new Date(newDate).toISOString());
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Αποτυχία αναπρογραμματισμού');
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();
  const minDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Αναπρογραμματισμός</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Επιλέξτε νέα ημερομηνία και ώρα για το ραντεβού.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <p className="text-slate-700"><span className="font-bold">Κατοικίδιο:</span> {petName}</p>
              <p className="text-slate-700"><span className="font-bold">Κτηνίατρος:</span> {vetName}</p>
              <p className="text-slate-700"><span className="font-bold">Τρέχον:</span> {formatDate(appointment.scheduled_at)}, {formatTime(appointment.scheduled_at)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Νέα ημερομηνία & ώρα</label>
              <input
                type="datetime-local"
                value={newDate}
                min={minDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-slate-800"
              />
              {newDate && new Date(newDate) <= new Date() && (
                <p className="text-xs text-red-500 mt-1">Η ημερομηνία πρέπει να είναι στο μέλλον.</p>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center mb-4">Ο κτηνίατρος θα πρέπει να επιβεβαιώσει το νέο ραντεβού.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleReschedule}
                disabled={submitting || !isValid}
                className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Αποθήκευση...
                  </span>
                ) : (
                  'Αναπρογραμματισμός'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AppointmentCard({
  apt,
  showActions,
  onCancel,
  onReschedule,
}: {
  apt: Appointment;
  showActions: boolean;
  onCancel: (apt: Appointment) => void;
  onReschedule: (apt: Appointment) => void;
}) {
  const petName = apt.pet?.name || 'Κατοικίδιο';
  const petImage = getImageUrl(apt.pet?.image_url);
  const vetName = apt.vet?.name || 'Κτηνίατρος';
  const vetSpecialty = apt.vet?.specialty || '';
  const address = apt.vet?.address;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-200 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-teal-50 flex items-center justify-center">
            {petImage ? (
              <img src={petImage} alt={petName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-teal-600 font-bold text-lg">{petName.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900">{petName}</h3>
              <StatusBadge status={apt.status} />
            </div>
            <p className="text-sm text-slate-600 font-medium">{apt.type}</p>
            <p className="text-sm text-slate-500">{vetName}{vetSpecialty ? ` • ${vetSpecialty}` : ''}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(apt.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(apt.scheduled_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {showActions && (
            <>
              <button
                onClick={() => onReschedule(apt)}
                className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-100 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Αναπρογραμματισμός
              </button>
              <button
                onClick={() => onCancel(apt)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Ακύρωση
              </button>
            </>
          )}
          {!showActions && apt.status === 'completed' && (
            <Link
              href="/owner/reviews"
              className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Αξιολόγηση
            </Link>
          )}
        </div>
      </div>

      {address && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
          <a
            href={
              apt.vet?.coordinates_lat && apt.vet?.coordinates_lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${apt.vet.coordinates_lat},${apt.vet.coordinates_lng}`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + (apt.vet?.city ? `, ${apt.vet.city}` : ''))}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {address}{apt.vet?.city ? `, ${apt.vet.city}` : ''}
          </a>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [petName, setPetName] = useState('');

  const filters = useMemo<AppointmentFilters>(() => ({
    status: activeTab,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    petName: petName || undefined,
  }), [activeTab, dateFrom, dateTo, petName]);

  const { appointments, total, totalPages, loading, error, refetch } = useMyAppointments(page, 10, filters);
  const [cancelDialog, setCancelDialog] = useState<Appointment | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<Appointment | null>(null);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleCancelSuccess = () => {
    setCancelDialog(null);
    refetch();
  };

  const handleRescheduleSuccess = () => {
    setRescheduleDialog(null);
    refetch();
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPetName('');
    setPage(1);
  };

  const hasFilters = dateFrom || dateTo || petName;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ραντεβού</h1>
          <p className="text-slate-500 mt-1">Διαχειριστείτε τα ραντεβού σας.</p>
        </div>
        <Link
          href="/owner/book"
          className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέο Ραντεβού
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 mb-4 inline-flex">
        <button
          onClick={() => handleTabChange('upcoming')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'upcoming'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Επερχόμενα
        </button>
        <button
          onClick={() => handleTabChange('past')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'past'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Ιστορικό
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Date From */}
        <DatePicker
          value={dateFrom}
          onChange={(v) => { setDateFrom(v); setPage(1); }}
          placeholder="Από"
        />

        <span className="text-slate-300 text-xs font-bold select-none">—</span>

        {/* Date To */}
        <DatePicker
          value={dateTo}
          onChange={(v) => { setDateTo(v); setPage(1); }}
          placeholder="Έως"
        />

        {/* Pet Search */}
        <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-2 gap-2">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={petName}
            onChange={(e) => { setPetName(e.target.value); setPage(1); }}
            placeholder="Κατοικίδιο..."
            className="text-sm text-slate-700 bg-transparent focus:outline-none w-32"
          />
        </div>

        {/* Clear All Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Καθαρισμός
          </button>
        )}

        {/* Result Count */}
        <span className="text-xs text-slate-400 ml-auto font-medium">{total} αποτελέσματα</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">Παρακαλώ δοκιμάστε ξανά αργότερα.</p>
        </div>
      )}

      {/* Appointments List */}
      {!loading && !error && (
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                showActions={activeTab === 'upcoming'}
                onCancel={setCancelDialog}
                onReschedule={setRescheduleDialog}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {activeTab === 'upcoming' ? 'Κανένα επερχόμενο ραντεβού' : 'Κανένα παλαιότερο ραντεβού'}
              </h3>
              <p className="text-slate-500 mb-6">
                {activeTab === 'upcoming' ? 'Κλείστε ένα ραντεβού για το κατοικίδιό σας.' : 'Δεν υπάρχει ιστορικό ραντεβού.'}
              </p>
              {activeTab === 'upcoming' && !hasFilters && (
                <Link
                  href="/owner/book"
                  className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Κλείστε Ραντεβού
                </Link>
              )}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Cancel Dialog */}
      {cancelDialog && (
        <CancelDialog
          appointment={cancelDialog}
          onClose={() => setCancelDialog(null)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog && (
        <RescheduleDialog
          appointment={rescheduleDialog}
          onClose={() => setRescheduleDialog(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
}
