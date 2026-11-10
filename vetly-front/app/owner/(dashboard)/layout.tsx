'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OwnerShell from '@/components/owner/OwnerShell';
import NotificationPopup from '@/components/NotificationPopup';
import { useNotificationPoller } from '@/hooks/useNotificationPoller';
import { getOwnerUnreadCount, getOwnerLatestUnread } from '@/hooks/useOwnerData';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();

  const { unreadCount, popupNotification, showPopup, dismissPopup } = useNotificationPoller({
    fetchUnreadCount: getOwnerUnreadCount,
    fetchLatestUnread: getOwnerLatestUnread,
    intervalMs: 10000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || userType !== 'pet_owner') {
      router.replace('/owner/login');
    }
  }, [isAuthenticated, userType, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-600" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'pet_owner') {
    return null;
  }

  return (
    <>
      <OwnerShell unreadCount={unreadCount}>{children}</OwnerShell>
      {showPopup && popupNotification && (
        <NotificationPopup
          notification={popupNotification}
          onDismiss={dismissPopup}
        />
      )}
    </>
  );
}
