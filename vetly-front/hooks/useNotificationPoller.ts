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
  /** Polling interval in milliseconds while the tab is visible */
  intervalMs?: number;
}

export function useNotificationPoller({
  fetchUnreadCount,
  fetchLatestUnread,
  intervalMs = 30000,
}: UseNotificationPollerOptions) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState<PopupNotification | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const lastSeenIdRef = useRef<string | null>(null);

  const stoppedRef = useRef(false);
  const failuresRef = useRef(0);

  const poll = useCallback(async () => {
    try {
      const { count } = await fetchUnreadCount();
      failuresRef.current = 0;
      setUnreadCount(count);

      if (count > 0) {
        const latest = await fetchLatestUnread();
        if (latest && latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          setPopupNotification(latest);
          setShowPopup(true);
        }
      }
    } catch (err) {
      // An expired session ends polling; the API client already redirects to login.
      if ((err as { status?: number })?.status === 401) stoppedRef.current = true;
      failuresRef.current += 1;
    }
  }, [fetchUnreadCount, fetchLatestUnread]);

  const dismissPopup = useCallback(() => {
    setShowPopup(false);
    setPopupNotification(null);
  }, []);

  // Poll only while the tab is visible, refresh at once when it becomes visible
  // again, and back off (up to 4x) after consecutive failures.
  useEffect(() => {
    stoppedRef.current = false;
    let timer: number | undefined;

    const clear = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      clear();
      if (stoppedRef.current || document.visibilityState !== 'visible') return;
      const delay = intervalMs * Math.min(4, 2 ** failuresRef.current);
      timer = window.setTimeout(async () => {
        await poll();
        schedule();
      }, delay);
    };
    const onVisibility = async () => {
      if (document.visibilityState !== 'visible') {
        clear();
        return;
      }
      clear();
      await poll();
      schedule();
    };

    void onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [poll, intervalMs]);

  return { unreadCount, popupNotification, showPopup, dismissPopup };
}
