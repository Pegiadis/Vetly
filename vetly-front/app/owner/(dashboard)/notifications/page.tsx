'use client';

import { useState } from 'react';

// Mock data
const mockNotifications = [
  {
    id: '1',
    type: 'medication',
    title: 'Υπενθύμιση φαρμάκου',
    message: 'Ώρα για το αντιπαρασιτικό του Μάξ!',
    date: '2024-06-23T09:00:00',
    isRead: false,
  },
  {
    id: '2',
    type: 'appointment',
    title: 'Επιβεβαίωση ραντεβού',
    message: 'Το ραντεβού σας με τον Δρ. Παπαδόπουλο επιβεβαιώθηκε για 25/06 στις 10:00.',
    date: '2024-06-22T14:30:00',
    isRead: false,
  },
  {
    id: '3',
    type: 'reply',
    title: 'Νέα απάντηση στην αξιολόγησή σας',
    message: 'Ο Δρ. Γεωργίου απάντησε στην αξιολόγησή σας.',
    date: '2024-06-21T10:15:00',
    isRead: true,
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Υπενθύμιση ραντεβού',
    message: 'Έχετε ραντεβού αύριο στις 10:00 για εμβολιασμό του Μάξ.',
    date: '2024-06-20T18:00:00',
    isRead: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'Καλώς ήρθατε στο Vetly!',
    message: 'Ευχαριστούμε για την εγγραφή σας. Ανακαλύψτε τις δυνατότητες της εφαρμογής.',
    date: '2024-06-15T09:00:00',
    isRead: true,
  },
];

const notificationIcons: Record<string, { bg: string; icon: JSX.Element }> = {
  medication: {
    bg: 'bg-amber-100 text-amber-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  appointment: {
    bg: 'bg-green-100 text-green-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  reply: {
    bg: 'bg-indigo-100 text-indigo-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  reminder: {
    bg: 'bg-blue-100 text-blue-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  system: {
    bg: 'bg-slate-100 text-slate-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const formatDate = (dateStr: string) => {
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
  };

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
            onClick={markAllAsRead}
            className="text-teal-600 font-bold text-sm hover:text-teal-700 transition-colors"
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
                onClick={() => markAsRead(notification.id)}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer ${
                  notification.isRead
                    ? 'border-slate-100 hover:border-slate-200'
                    : 'border-teal-200 bg-teal-50/30 hover:bg-teal-50/50'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyle.bg}`}>
                    {iconStyle.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className={`font-bold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(notification.date)}
                      </span>
                    </div>
                    <p className={`text-sm ${notification.isRead ? 'text-slate-500' : 'text-slate-700'}`}>
                      {notification.message}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2" />
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
    </div>
  );
}
