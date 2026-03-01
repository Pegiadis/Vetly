'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import VetSidebar from '@/components/vet/VetSidebar';
import VetHeader from '@/components/vet/VetHeader';
import NotificationPopup from '@/components/NotificationPopup';
import { useNotificationPoller } from '@/hooks/useNotificationPoller';
import { getVetUnreadCount, getVetLatestUnread } from '@/hooks/useVetData';

export default function VetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { unreadCount, popupNotification, showPopup, dismissPopup } = useNotificationPoller({
    fetchUnreadCount: getVetUnreadCount,
    fetchLatestUnread: getVetLatestUnread,
    intervalMs: 10000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || userType !== 'vet') {
      router.replace('/vet/login');
    }
  }, [isAuthenticated, userType, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'vet') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <VetSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:ml-64">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Άνοιγμα μενού"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">Vetly</span>
            <span className="text-xs text-indigo-600 font-semibold">Pro</span>
          </div>
          {/* Spacer to center the logo */}
          <div className="w-10" />
        </div>

        <VetHeader unreadCount={unreadCount} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      {showPopup && popupNotification && (
        <NotificationPopup
          notification={popupNotification}
          onDismiss={dismissPopup}
        />
      )}
    </div>
  );
}
