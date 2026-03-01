'use client';

import React, { useState, useMemo } from 'react';
import {
  useVetNotifications,
  markVetNotificationRead,
  markAllVetNotificationsRead,
} from '@/hooks/useVetData';
import Pagination from '@/components/Pagination';

const svgIcon = (d: string) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const notificationIcons: Record<string, { bg: string; icon: React.ReactNode }> = {
  appointment_new: {
    bg: 'bg-teal-100 text-teal-600',
    icon: svgIcon('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
  },
  appointment_cancel: {
    bg: 'bg-red-100 text-red-600',
    icon: svgIcon('M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  appointment_reschedule: {
    bg: 'bg-amber-100 text-amber-600',
    icon: svgIcon('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
  review: {
    bg: 'bg-yellow-100 text-yellow-600',
    icon: svgIcon('M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'),
  },
  client: {
    bg: 'bg-violet-100 text-violet-600',
    icon: svgIcon('M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'),
  },
  system: {
    bg: 'bg-slate-100 text-slate-600',
    icon: svgIcon('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'),
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} λεπτά πριν`;
  if (diffHours < 24) return `${diffHours} ώρες πριν`;
  if (diffDays < 7) return `${diffDays} ημέρες πριν`;
  return date.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
}

export default function VetNotificationsPage() {
  const [page, setPage] = useState(1);
  const { notifications, totalPages, loading, error, refetch } = useVetNotifications(page, 10);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  const handleMarkRead = async (id: string) => {
    try {
      await markVetNotificationRead(id);
      refetch();
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllVetNotificationsRead();
      refetch();
    } catch {
      // silent
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ειδοποιήσεις</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} νέες ειδοποιήσεις`
              : 'Έχετε διαβάσει όλες τις ειδοποιήσεις'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
          >
            Σήμανση όλων ως αναγνωσμένα
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const iconStyle = notificationIcons[notification.type] || notificationIcons.system;

            return (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                  !notification.is_read ? 'cursor-pointer' : ''
                } ${
                  notification.is_read
                    ? 'border-slate-100 hover:border-slate-200'
                    : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/50'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyle.bg}`}>
                    {iconStyle.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className={`font-bold ${notification.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm ${notification.is_read ? 'text-slate-500' : 'text-slate-700'}`}>
                      {notification.message}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Καμία ειδοποίηση</h3>
            <p className="text-slate-500">Δεν έχετε νέες ειδοποιήσεις.</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
