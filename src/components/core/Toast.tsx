'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      showToast: () => {},
      success: (msg: string) => console.log('[Toast Success]:', msg),
      error: (msg: string) => console.error('[Toast Error]:', msg),
      warning: (msg: string) => console.warn('[Toast Warning]:', msg),
      info: (msg: string) => console.info('[Toast Info]:', msg),
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    ({ type, message, title, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = React.useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast]
  );
  const error = React.useCallback(
    (message: string, title?: string) => showToast({ type: 'error', message, title }),
    [showToast]
  );
  const warning = React.useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    [showToast]
  );
  const info = React.useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        role="region"
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'border-emerald-200 bg-white text-emerald-950 shadow-md',
            error: 'border-red-200 bg-white text-red-950 shadow-md',
            warning: 'border-amber-200 bg-white text-amber-950 shadow-md',
            info: 'border-neutral-200 bg-white text-neutral-900 shadow-md',
          }[toast.type];

          const Icon = {
            success: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />,
            error: <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />,
            warning: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />,
            info: <Info className="h-4 w-4 shrink-0 text-neutral-600 mt-0.5" />,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 transition-all duration-200 animate-in slide-in-from-bottom-5',
                typeStyles
              )}
            >
              {Icon}
              <div className="flex-1 space-y-0.5 text-xs">
                {toast.title && <p className="font-semibold text-neutral-900">{toast.title}</p>}
                <p className="leading-relaxed text-neutral-600">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
