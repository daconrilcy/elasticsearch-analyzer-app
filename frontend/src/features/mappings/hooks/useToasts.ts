import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  // Helpers pour les types courants
  const success = useCallback((message: string, duration?: number) => {
    show(message, 'success', duration);
  }, [show]);

  const error = useCallback((message: string, duration?: number) => {
    show(message, 'error', duration);
  }, [show]);

  const info = useCallback((message: string, duration?: number) => {
    show(message, 'info', duration);
  }, [show]);

  return {
    toasts,
    show,
    success,
    error,
    info,
    remove,
    clear,
  };
}
