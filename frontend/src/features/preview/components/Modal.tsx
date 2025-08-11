import React, { useState } from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showFullscreenToggle?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showFullscreenToggle = false,
  className = '',
}: ModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={`${styles.modalContent} ${isFullscreen ? styles.fullscreen : ''} ${className}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h3>{title}</h3>
          <div className={styles.headerActions}>
            {showFullscreenToggle && (
              <button onClick={toggleFullscreen} className={styles.fullscreenButton}>
                {isFullscreen ? '↗' : '⛶'}
              </button>
            )}
            <button onClick={onClose} className={styles.closeButton}>&times;</button>
          </div>
        </header>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

