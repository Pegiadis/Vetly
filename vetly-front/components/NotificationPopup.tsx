'use client';

import { useEffect, useState } from 'react';
import type { PopupNotification } from '@/hooks/useNotificationPoller';

interface IconStyle {
  path: string;
  color: string;
  bg: string;
}

const TYPE_ICONS: Record<string, IconStyle> = {
  appointment_new: {
    path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  appointment_cancel: {
    path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  appointment_reschedule: {
    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  appointment_confirm: {
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  appointment_reject: {
    path: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  appointment_complete: {
    path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  review: {
    path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  reply: {
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  client: {
    path: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
};

const DEFAULT_ICON: IconStyle = {
  path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  color: 'text-slate-600',
  bg: 'bg-slate-100',
};

interface NotificationPopupProps {
  notification: PopupNotification;
  onDismiss: () => void;
}

export default function NotificationPopup({ notification, onDismiss }: NotificationPopupProps) {
  const [visible, setVisible] = useState(false);

  // Slide in on mount, stay visible for 4s, then slide out
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 50);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4350);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDismiss]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const iconStyle = TYPE_ICONS[notification.type] || DEFAULT_ICON;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100">
        <div
          className="h-full bg-teal-500"
          style={{ animation: 'shrink 4s linear 0.35s forwards' }}
        />
      </div>

      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full ${iconStyle.bg} flex items-center justify-center shrink-0`}>
            <svg className={`w-4 h-4 ${iconStyle.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconStyle.path} />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {notification.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-0.5"
            aria-label="close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
