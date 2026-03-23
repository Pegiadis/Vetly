'use client';

import { useState } from 'react';
import { useOwnerReminders, dismissReminder } from '@/hooks/useOwnerData';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/Toast';

const DEFAULT_TYPE_LABELS: Record<string, string> = {
  vaccination: 'Εμβολιασμός',
  checkup: 'Έλεγχος',
  medication: 'Φαρμακευτική Αγωγή',
  custom: 'Γενικό',
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  vaccination: 'bg-green-100 text-green-700',
  checkup: 'bg-blue-100 text-blue-700',
  medication: 'bg-purple-100 text-purple-700',
  custom: 'bg-slate-100 text-slate-700',
};

function getTypeBadgeClass(type: string): string {
  return TYPE_BADGE_CLASSES[type] || 'bg-slate-100 text-slate-700';
}

function getTypeLabel(type: string): string {
  return DEFAULT_TYPE_LABELS[type] || type;
}

function getDueDateStyle(dueDateStr: string): { text: string; border: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return { text: 'text-red-600', border: 'border-red-200' };
  if (diffDays <= 7) return { text: 'text-amber-600', border: 'border-amber-200' };
  return { text: 'text-green-600', border: 'border-green-200' };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface DismissDialogProps {
  reminder: { id: string; title: string; due_date: string } | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DismissDialog({ reminder, loading, onConfirm, onCancel }: DismissDialogProps) {
  if (!reminder) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Απόρριψη Υπενθύμισης</h3>
        <p className="text-slate-600 mb-1">
          Είστε σίγουροι ότι θέλετε να απορρίψετε αυτή την υπενθύμιση; Ο κτηνίατρος θα ειδοποιηθεί.
        </p>
        <div className="bg-slate-50 rounded-xl p-3 my-4 space-y-1">
          <p className="text-sm font-semibold text-slate-800">{reminder.title}</p>
          <p className="text-xs text-slate-500">{formatDate(reminder.due_date)}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Πίσω
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Απόρριψη...' : 'Απόρριψη'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerRemindersPage() {
  const [page, setPage] = useState(1);
  const { reminders, totalPages, loading, error, refetch } = useOwnerReminders(page, 10);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [dismissTarget, setDismissTarget] = useState<{ id: string; title: string; due_date: string } | null>(null);
  const toast = useToast();

  const openDismissDialog = (reminder: { id: string; title: string; due_date: string }) => {
    if (dismissing) return;
    setDismissTarget(reminder);
  };

  const handleDismiss = async () => {
    if (!dismissTarget || dismissing) return;
    setDismissing(dismissTarget.id);
    try {
      await dismissReminder(dismissTarget.id);
      setDismissTarget(null);
      refetch();
      toast.success('Η υπενθύμιση απορρίφθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setDismissing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Υπενθυμίσεις</h1>
        <p className="text-slate-500 mt-1">
          {reminders.length > 0
            ? `${reminders.length} υπενθυμίσεις`
            : 'Δεν υπάρχουν ενεργές υπενθυμίσεις'}
        </p>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length > 0 ? (
          reminders.map((reminder) => {
            const dueDateStyle = getDueDateStyle(reminder.due_date);
            const typeBadge = getTypeBadgeClass(reminder.type);
            const typeLabel = getTypeLabel(reminder.type);

            return (
              <div
                key={reminder.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${dueDateStyle.border} ${
                  reminder.is_dismissed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Pet Icon */}
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row: pet name + type badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">
                        {reminder.pet_name || 'Κατοικίδιο'}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBadge}`}>
                        {typeLabel}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 mb-1">{reminder.title}</h3>

                    {/* Message */}
                    {reminder.message && (
                      <p className="text-sm text-slate-600 mb-2">{reminder.message}</p>
                    )}

                    {/* Due date + vet name */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <span className={`flex items-center gap-1 font-semibold ${dueDateStyle.text}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(reminder.due_date)}
                      </span>
                      {reminder.vet_name && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {reminder.vet_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dismiss button */}
                  {!reminder.is_dismissed && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => openDismissDialog({ id: reminder.id, title: reminder.title, due_date: reminder.due_date })}
                        disabled={dismissing === reminder.id}
                        className="text-xs font-bold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {dismissing === reminder.id ? '...' : 'Απόρριψη'}
                      </button>
                    </div>
                  )}
                  {reminder.is_dismissed && (
                    <div className="flex-shrink-0">
                      <span className="text-xs text-slate-400 border border-slate-100 px-3 py-1.5 rounded-lg">
                        Απορρίφθηκε
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Δεν υπάρχουν υπενθυμίσεις</h3>
            <p className="text-slate-500">Ο κτηνίατρός σας δεν έχει στείλει υπενθυμίσεις ακόμα.</p>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <DismissDialog
        reminder={dismissTarget}
        loading={dismissing !== null}
        onConfirm={handleDismiss}
        onCancel={() => setDismissTarget(null)}
      />
    </div>
  );
}
