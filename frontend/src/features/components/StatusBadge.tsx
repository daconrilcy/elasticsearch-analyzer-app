import React from 'react';
import { FileStatus } from '../../types/api.v1';

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
    <div className={`status-badge ${info.className}`} title={info.text}>
      <span className="icon">{info.icon}</span>
      <span>{info.text}</span>
    </div>
  );
};