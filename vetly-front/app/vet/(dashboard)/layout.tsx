'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClinicHomeShell from '@/components/vet/ClinicHomeShell';
import { useAuth } from '@/contexts/AuthContext';
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
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-600" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'vet') {
    return null;
  }

  return <>
    <ClinicHomeShell unreadCount={unreadCount}>{children}</ClinicHomeShell>
    {showPopup && popupNotification && <NotificationPopup notification={popupNotification} onDismiss={dismissPopup} />}
  </>;
}
