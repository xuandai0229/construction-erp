'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantClass: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(() => remove(id), toast.variant === 'error' ? 6500 : 4200);
  }, [remove]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-lg border bg-[var(--card)] p-4 shadow-[var(--erp-hover-shadow)] backdrop-blur-md animate-slide-in-right ${variantClass[toast.variant]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-black uppercase tracking-wider">{toast.title}</div>
                {toast.message && (
                  <div className="mt-1 text-[12px] font-semibold leading-relaxed text-[var(--text-secondary)]">{toast.message}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Đóng thông báo"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
