import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FileDetail, FileOut } from '../../types/api.v1';
import { FileStatus } from '../../types/api.v1';
import { StatusBadge } from './StatusBadge';
import { DataPreviewModal } from './DataPreviewModal';

interface FileListItemProps {
  file: FileDetail;
  onDelete: (fileId: string) => void;
  onReparse: (fileId: string) => void;
  onCreateMapping: (file: FileOut) => void;
}

export const FileListItem: React.FC<FileListItemProps> = ({ file, onDelete, onReparse, onCreateMapping }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  return (
    <li className={`file-list-item status-${file.status}`}>
      <div className="file-item-main">
        <StatusBadge status={file.status} />
        <div className="file-info">
          <span className="file-name">{file.filename_original}</span>
          <span className="file-meta">
            Version {file.version}・{formatBytes(file.size_bytes)}・Ajouté le {formatDate(file.created_at)}
          </span>
        </div>
        <div className="file-actions">
          <button onClick={() => setIsPreviewOpen(true)} disabled={file.status !== FileStatus.READY}>Aperçu</button>
          {file.mapping_id ? (
            <Link to={`/mappings/${file.mapping_id}`} className="button">Voir Mapping</Link>
          ) : (
            <button onClick={() => onCreateMapping(file)} disabled={file.status !== FileStatus.READY}>Créer Mapping</button>
          )}
          <button onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? 'Moins' : 'Détails'}</button>
        </div>
      </div>

      {isExpanded && (
        <div className="file-item-details">
          <h4>Informations Techniques</h4>
          <ul>
            <li><strong>Uploader:</strong> {file.uploader_name || 'N/A'}</li>
            <li><strong>Lignes:</strong> {file.line_count ?? 'N/A'}</li>
            <li><strong>Colonnes:</strong> {file.column_count ?? 'N/A'}</li>
            <li><strong>Dernière modification:</strong> {formatDate(file.updated_at)}</li>
            <li className="file-hash"><strong>Hash (SHA-256):</strong> <span>{file.hash || 'N/A'}</span></li>
          </ul>
          <div className="details-actions">
             <button className="download-button">Télécharger</button>
             <button className="delete-button" onClick={() => onDelete(file.id)}>Supprimer</button>
          </div>
        </div>
      )}

      {file.status === FileStatus.ERROR && (
        <div className="file-item-error">
          <p><strong>Erreur de parsing :</strong> {file.parsing_error || 'Une erreur inconnue est survenue.'}</p>
          <button onClick={() => onReparse(file.id)}>Relancer le traitement</button>
        </div>
      )}

      <DataPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        filename={file.filename_original}
        data={file.preview_data || []}
      />
    </li>
  );
};