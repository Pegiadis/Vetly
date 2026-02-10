'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useVetReviews, useVetReviewStats, replyToReview } from '@/hooks/useVetData';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function VetReviewsPage() {
  const { reviews, loading: reviewsLoading, error, refetch } = useVetReviews();
  const { stats, loading: statsLoading } = useVetReviewStats();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loading = reviewsLoading || statsLoading;

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
      await refetch();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
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
        </div>
      </div>
    );
  }

  const avgRating = Number(stats?.average_rating ?? 0).toFixed(1);
  const totalReviews = stats?.total_reviews ?? 0;
  const distribution = stats?.rating_distribution ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/vet/dashboard" className="text-slate-500 text-sm font-bold mb-2 hover:text-indigo-600 block">
          &larr; Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Αξιολογήσεις</h1>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{avgRating}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(parseFloat(avgRating)) ? 'text-amber-400' : 'text-slate-200'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <div className="text-slate-500 text-sm mt-1">{totalReviews} αξιολογήσεις</div>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const entry = distribution.find(d => d.rating === stars);
              const count = entry?.count ?? 0;
              const percentage = entry?.percentage ?? 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 w-3">{stars}</span>
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-slate-400 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Δεν υπάρχουν αξιολογήσεις</h3>
          <p className="text-slate-500">Οι αξιολογήσεις θα εμφανιστούν εδώ μόλις οι ιδιοκτήτες αφήσουν κριτικές.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  {review.pet_owner?.image_url ? (
                    <img src={review.pet_owner.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-indigo-600 font-bold text-lg">{review.pet_owner?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{review.pet_owner?.name || 'Ιδιοκτήτης'}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-slate-200'}`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-slate-600">{review.comment}</p>

                  {review.reply && (
                    <div className="mt-4 bg-indigo-50 rounded-xl p-4 border-l-4 border-indigo-500">
                      <p className="text-sm text-slate-500 font-bold mb-1">Η απάντησή σας:</p>
                      <p className="text-slate-700">{review.reply}</p>
                    </div>
                  )}

                  {!review.reply && replyingTo !== review.id && (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="mt-3 text-sm text-indigo-600 font-bold hover:text-indigo-700"
                    >
                      Απάντηση
                    </button>
                  )}

                  {replyingTo === review.id && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Γράψτε την απάντησή σας..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          disabled={submitting}
                          className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50"
                        >
                          Ακύρωση
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={submitting || !replyText.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {submitting ? 'Αποστολή...' : 'Αποστολή'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
