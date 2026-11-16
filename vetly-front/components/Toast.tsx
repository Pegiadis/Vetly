'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;

const typeStyles: Record<ToastType, { icon: string; iconColor: string; bar: string; role: 'status' | 'alert' }> = {
  success: {
    icon: 'M5 13l4 4L19 7',
    iconColor: 'text-clinic-600',
    bar: 'bg-clinic-600',
    role: 'status',
  },
  error: {
    icon: 'M6 18L18 6M6 6l12 12',
    iconColor: 'text-red-600',
    bar: 'bg-red-600',
    role: 'alert',
  },
  info: {
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconColor: 'text-ink-500',
    bar: 'bg-ink-400',
    role: 'status',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const style = typeStyles[toast.type];
  const [progress, setProgress] = useState(100);
  const startRef = useRef(toast.createdAt);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [toast.id, onRemove]);

  return (
    <div
      role={style.role}
      className="animate-slide-in-right relative w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-xl border border-ink-200 bg-white text-ink-800"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <svg className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
        </svg>
        <p className="flex-1 text-sm leading-5 text-ink-800">{toast.message}</p>
        <button
          type="button"
          onClick={() => onRemove(toast.id)}
          aria-label="Κλείσιμο"
          className="-mr-1 shrink-0 rounded-md p-1 text-ink-400 transition-colors hover:bg-black/[0.06] hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-clinic-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-0.5 bg-ink-100">
        <div className={`h-full ${style.bar} transition-none`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message, createdAt: Date.now() }]);
  }, []);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2 [&>*]:pointer-events-auto">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
