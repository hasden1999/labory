'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'urgent';

interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  urgent: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 3500) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, message, type, title, duration };
      
      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title = 'نجاح') => showToast(msg, 'success', title), [showToast]);
  const error = useCallback((msg: string, title = 'تنبيه خطأ') => showToast(msg, 'error', title, 5000), [showToast]);
  const warning = useCallback((msg: string, title = 'تنبيه') => showToast(msg, 'warning', title), [showToast]);
  const info = useCallback((msg: string, title = 'معلومة') => showToast(msg, 'info', title), [showToast]);
  const urgent = useCallback((msg: string, title = '<AlertOctagon size={12} /> حالة إسعافية عاجلة') => showToast(msg, 'urgent', title, 6000), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, urgent }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => {
          const getIcon = () => {
            switch (t.type) {
              case 'success':
                return <CheckCircle2 size={19} color="#10b981" />;
              case 'error':
                return <AlertCircle size={19} color="#f43f5e" />;
              case 'warning':
                return <AlertTriangle size={19} color="#f59e0b" />;
              case 'urgent':
                return <AlertCircle size={19} color="#ffffff" />;
              default:
                return <Info size={19} color="#06b6d4" />;
            }
          };

          return (
            <div key={t.id} className={`toast-item toast-${t.type}`}>
              <div className="toast-icon-wrap">{getIcon()}</div>
              <div className="toast-body">
                {t.title && <strong className="toast-title">{t.title}</strong>}
                <p className="toast-message">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="toast-close"
                aria-label="إغلاق"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
