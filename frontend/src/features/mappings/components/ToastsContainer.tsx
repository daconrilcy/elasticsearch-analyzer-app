import React from 'react';
import { useToasts } from '../hooks/useToasts';
import styles from './ToastsContainer.module.scss';

export const ToastsContainer: React.FC = () => {
  const { toasts, remove } = useToasts();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          role="alert"
          aria-live="polite"
        >
          <div className={styles.content}>
            <div className={styles.icon}>
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'info' && 'ℹ️'}
            </div>
            <div className={styles.message}>{toast.message}</div>
            <button
              className={styles.closeButton}
              onClick={() => remove(toast.id)}
              aria-label="Fermer la notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastsContainer;
