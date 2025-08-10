import React from 'react';
import { FileStatus } from '@shared/types';
import styles from './StatusBadge.module.scss'

interface StatusBadgeProps {
  status: FileStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusInfo = {
    [FileStatus.READY]: { text: 'Prêt', className: 'ready', icon: '✅' },
    [FileStatus.PARSING]: { text: 'En cours', className: 'parsing', icon: '⏳' },
    [FileStatus.PENDING]: { text: 'En attente', className: 'pending', icon: '⏳' },
    [FileStatus.ERROR]: { text: 'Erreur', className: 'error', icon: '❗️' },
  };

  const info = statusInfo[status] || { text: status, className: 'default', icon: '❓' };

  return (
    <div className={`${styles.statusBadge} ${info.className}`} title={info.text}>
      <span className={styles.icon}>{info.icon}</span>
      <span>{info.text}</span>
    </div>
  );
};