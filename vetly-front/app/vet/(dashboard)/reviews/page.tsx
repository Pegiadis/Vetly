'use client';


import { ClinicButton, ClinicPanel, ClinicTextarea, ClinicPageHeader } from '@/components/vet/ClinicUI';
import { useState } from 'react';
import { useVetReviews, useVetReviewStats, replyToReview, updateReviewReply, deleteReviewReply } from '@/hooks/useVetData';
import { useToast } from '@/components/Toast';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function ReviewStars({ rating }: { rating: number }) {
  return <span role="img" aria-label={`${rating} από 5 αστέρια`} className="inline-flex gap-0.5">{[1, 2, 3, 4, 5].map(star => <svg key={star} aria-hidden="true" className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? 'text-clinic-600' : 'text-ink-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1z" /></svg>)}</span>;
}

export default function VetReviewsPage() {
  const [page, setPage] = useState(1);
  const { reviews, totalPages, loading: reviewsLoading, error, refetch } = useVetReviews(page, 10);
  const { stats, loading: statsLoading } = useVetReviewStats();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const loading = reviewsLoading || statsLoading;

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
      await refetch();
      toast.success('Η απάντηση αποστάλθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await updateReviewReply(reviewId, replyText.trim());
      setEditingReply(null);
      setReplyText('');
      await refetch();
      toast.success('Η απάντηση ενημερώθηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε την απάντησή σας;')) return;
    setSubmitting(true);
    try {
      await deleteReviewReply(reviewId);
      await refetch();
      toast.success('Η απάντηση διαγράφηκε.');
    } catch {
      toast.error('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const avgRating = Number(stats?.average_rating ?? 0).toFixed(1);
  const totalReviews = stats?.total_reviews ?? 0;
  const distribution = stats?.rating_distribution ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <ClinicPageHeader title="Αξιολογήσεις" description="Τα σχόλια των κηδεμόνων και οι απαντήσεις του κτηνιατρείου σας." />
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside aria-label="Σύνοψη αξιολογήσεων" className="space-y-4 lg:sticky lg:top-20">
          <ClinicPanel className="overflow-hidden">
            <div className="border-b border-ink-200 p-4">
              <h2 className="text-sm font-semibold text-ink-900">Συνολική εικόνα</h2>
              <div className="mt-4 flex items-baseline gap-1"><strong className="text-3xl font-semibold tracking-tight text-ink-900">{totalReviews ? avgRating : '—'}</strong><span className="text-xs text-ink-500">/ 5</span></div>
              <div className="mt-2"><ReviewStars rating={Number(avgRating)} /></div>
              <p className="mt-1 text-xs text-ink-500">{totalReviews} αξιολογήσεις συνολικά</p>
            </div>
            <div className="space-y-2 p-4" aria-label="Κατανομή βαθμολογίας">
              {[5, 4, 3, 2, 1].map(stars => {
                const entry = distribution.find(d => d.rating === stars);
                return <div key={stars} className="flex items-center gap-2 text-xs text-ink-500" aria-label={`${stars} αστέρια: ${entry?.count ?? 0} αξιολογήσεις`}>
                  <span className="w-7 shrink-0 whitespace-nowrap">{stars} ★</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-clinic-400" style={{ width: `${Math.max(0, Math.min(100, entry?.percentage ?? 0))}%` }} /></div><span className="w-5 text-right tabular-nums">{entry?.count ?? 0}</span>
                </div>;
              })}
            </div>
          </ClinicPanel>
          <div className="px-1"><h2 className="text-xs font-semibold text-ink-800">Η απάντησή σας μετράει</h2><p className="mt-2 text-xs leading-5 text-ink-500">Ευχαριστήστε τους κηδεμόνες και απαντήστε στα σχόλιά τους. Οι απαντήσεις εμφανίζονται στο δημόσιο προφίλ σας.</p></div>
        </aside>
        <ClinicPanel className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">Σχόλια κηδεμόνων</h2><span className="text-xs text-ink-500">Σελίδα {page} από {Math.max(1, totalPages)}</span>
          </div>
          {reviews.length === 0 ? <div className="px-5 py-14 text-center"><h3 className="text-sm font-semibold text-ink-800">Δεν υπάρχουν αξιολογήσεις</h3><p className="mt-2 text-xs text-ink-500">Τα σχόλια των κηδεμόνων θα εμφανίζονται εδώ.</p></div> : <div className="divide-y divide-ink-200">
            {reviews.map(review => {
              const isEditing = editingReply === review.id;
              const formOpen = isEditing || replyingTo === review.id;
              return <article key={review.id} className="px-4 py-3.5 sm:px-5" aria-labelledby={`review-${review.id}`}>
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0"><h3 id={`review-${review.id}`} className="break-words text-sm font-semibold text-ink-900">{review.pet_owner?.name || 'Κηδεμόνας'}</h3><div className="mt-1 flex flex-wrap items-center gap-2"><ReviewStars rating={review.rating} /><time dateTime={review.created_at} className="text-xs text-ink-500">{formatDate(review.created_at)}</time></div></div>
                  <div className="flex items-center gap-2"><span className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-xs font-medium ${review.reply ? 'bg-clinic-100 text-clinic-800' : 'bg-ink-100 text-ink-600'}`}>{review.reply ? 'Απαντήθηκε' : 'Χωρίς απάντηση'}</span>{!review.reply && !formOpen && <ClinicButton variant="secondary" disabled={submitting} onClick={() => { setReplyingTo(review.id); setEditingReply(null); setReplyText(''); }}>Απάντηση</ClinicButton>}</div>
                </header>
                <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">{review.comment || 'Ο κηδεμόνας άφησε μόνο βαθμολογία.'}</p>
                {review.reply && !isEditing && <div className="mt-3 rounded-[10px] bg-ink-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-semibold text-ink-800">Απάντηση κτηνιατρείου</h4><div className="flex gap-1">
                    <ClinicButton variant="ghost" disabled={submitting} onClick={() => { setEditingReply(review.id); setReplyingTo(null); setReplyText(review.reply || ''); }}>Επεξεργασία</ClinicButton>
                    <ClinicButton variant="danger" disabled={submitting} onClick={() => handleDeleteReply(review.id)}>Διαγραφή</ClinicButton>
                  </div></div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">{review.reply}</p>
                </div>}
                {formOpen && <form className="mt-4 overflow-hidden rounded-lg border border-ink-200" onSubmit={e => { e.preventDefault(); if (!submitting) void (isEditing ? handleEditReply(review.id) : handleReply(review.id)); }}>
                  <div className="border-b border-ink-200 bg-ink-50/60 px-3 py-3"><label htmlFor={`reply-${review.id}`} className="text-xs font-semibold text-ink-900">{isEditing ? 'Επεξεργασία απάντησης' : 'Η απάντησή σας'}</label><p className="mt-1 text-xs text-ink-500">Προς {review.pet_owner?.name || 'τον κηδεμόνα'} · Δημόσια απάντηση</p></div>
                  <div className="p-3"><ClinicTextarea id={`reply-${review.id}`} autoFocus disabled={submitting} className="w-full" rows={4} placeholder={isEditing ? 'Επεξεργασία απάντησης...' : 'Γράψτε την απάντησή σας...'} value={replyText} onChange={e => setReplyText(e.target.value)} /></div>
                  <div className="flex justify-end gap-2 border-t border-ink-200 bg-ink-50/60 px-3 py-2">
                    <ClinicButton type="button" variant="secondary" disabled={submitting} onClick={() => { setReplyingTo(null); setEditingReply(null); setReplyText(''); }}>Ακύρωση</ClinicButton>
                    <ClinicButton type="submit" variant="primary" disabled={submitting || !replyText.trim()}>{submitting ? (isEditing ? 'Αποθήκευση...' : 'Αποστολή...') : (isEditing ? 'Αποθήκευση' : 'Αποστολή')}</ClinicButton>
                  </div>
                </form>}
              </article>;
            })}
          </div>}
          <footer className="flex items-center justify-between gap-2 border-t border-ink-200 bg-ink-50/60 px-4 py-2">
            <span className="text-xs text-ink-500">{reviews.length} αξιολογήσεις σε αυτή τη σελίδα</span>
            <div className="flex gap-1"><ClinicButton aria-label="Προηγούμενη σελίδα" disabled={page <= 1 || submitting} onClick={() => { setPage(page - 1); setReplyingTo(null); setEditingReply(null); setReplyText(''); }}>‹</ClinicButton><ClinicButton aria-label="Επόμενη σελίδα" disabled={page >= totalPages || submitting} onClick={() => { setPage(page + 1); setReplyingTo(null); setEditingReply(null); setReplyText(''); }}>›</ClinicButton></div>
          </footer>
        </ClinicPanel>
      </div>
    </div>
  );
}
