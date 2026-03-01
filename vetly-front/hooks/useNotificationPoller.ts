import { useState, useEffect, useCallback, useRef } from 'react';

export interface PopupNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface UseNotificationPollerOptions {
  /** Function that returns the unread count */
  fetchUnreadCount: () => Promise<{ count: number }>;
  /** Function that returns the latest unread notification */
  fetchLatestUnread: () => Promise<PopupNotification | null>;
  /** Polling interval in milliseconds */
  intervalMs?: number;
}

export function useNotificationPoller({
  fetchUnreadCount,
  fetchLatestUnread,
  intervalMs = 20000,
}: UseNotificationPollerOptions) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState<PopupNotification | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const lastSeenIdRef = useRef<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const { count } = await fetchUnreadCount();
      setUnreadCount(count);

      if (count > 0) {
        const latest = await fetchLatestUnread();
        if (latest && latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          setPopupNotification(latest);
          setShowPopup(true);
        }
      }
    } catch {
      // Silently ignore polling errors (e.g. expired token)
    }
  }, [fetchUnreadCount, fetchLatestUnread]);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    setPopupNotification(null);
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [poll, intervalMs]);

  return { unreadCount, popupNotification, showPopup, dismissPopup };
}
