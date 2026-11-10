'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/api';

interface OwnerHeaderProps {
  unreadCount: number;
}

export default function OwnerHeader({ unreadCount }: OwnerHeaderProps) {
  const { user } = useAuth();
  const ownerName = user?.name || '';
  const ownerImage = getImageUrl(user?.image_url);

  return (
    <header className="h-16 bg-white border-b border-ink-100 flex items-center justify-between gap-2 px-4 sm:px-6 sticky top-[60px] md:top-0 z-20">
      <div className="min-w-0 flex-1" />

      {/* Right Side */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Quick Book Button */}
        <Link
          href="/owner/book"
          className="hidden sm:flex items-center gap-2 bg-clinic-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-clinic-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Νέο Ραντεβού
        </Link>

        {/* Notifications */}
        <Link
          href="/owner/notifications"
          aria-label={`Ειδοποιήσεις${unreadCount ? `, ${unreadCount} νέες` : ''}`}
          className="relative p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-50 rounded-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <Link
          href="/owner/settings"
          aria-label="Ρυθμίσεις λογαριασμού"
          className="flex items-center gap-3 hover:bg-ink-50 p-2 rounded-xl transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-clinic-100 flex items-center justify-center overflow-hidden">
            {ownerImage ? (
              <img src={ownerImage} alt={ownerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-clinic-600 font-bold text-sm">
                {ownerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-ink-800">{ownerName}</p>
            <p className="text-xs text-ink-500">Ιδιοκτήτης</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
