import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FileDetail, FileOut } from '@shared/types';
import { FileStatus } from '@shared/types';
import { StatusBadge } from '@features/analyzers';
import { FilePreviewModal } from '@features/preview';
import styles from './FileListItem.module.scss'

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
            <li className={`${styles.fileListItem} ${styles[`status${file.status.charAt(0).toUpperCase() + file.status.slice(1)}`]}`}>
      <div className={styles.fileItemMain}>
        <StatusBadge status={file.status} />
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{file.filename_original}</span>
          <span className={styles.fileMeta}>
            Version {file.version}・{formatBytes(file.size_bytes)}・Ajouté le {formatDate(file.created_at)}
          </span>
        </div>
        <div className={styles.fileActions}>
          <button onClick={() => setIsPreviewOpen(true)} disabled={file.status !== FileStatus.READY} className="button ghost">Aperçu</button>
          {file.mapping_id ? (
            <Link to={`/mappings/${file.mapping_id}`} className="button">Voir Mapping</Link>
          ) : (
            <button onClick={() => onCreateMapping(file)} disabled={file.status !== FileStatus.READY} className="button primary">Créer Mapping</button>
          )}
          <button onClick={() => setIsExpanded(!isExpanded)} className="button ghost">{isExpanded ? 'Moins' : 'Détails'}</button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.fileItemDetails}>
          <h4>Informations Techniques</h4>
          <ul>
            <li><strong>Uploader:</strong> {file.uploader_name || 'N/A'}</li>
            <li><strong>Lignes:</strong> {file.line_count ?? 'N/A'}</li>
            <li><strong>Colonnes:</strong> {file.column_count ?? 'N/A'}</li>
            <li><strong>Dernière modification:</strong> {formatDate(file.updated_at)}</li>
            <li className={styles.fileHash}><strong>Hash (SHA-256):</strong> <span>{file.hash || 'N/A'}</span></li>
          </ul>
          <div className={styles.detailsActions}>
             <button className="button">Télécharger</button>
             <button className="button danger" onClick={() => onDelete(file.id)}>Supprimer</button>
          </div>
        </div>
      )}

      {file.status === FileStatus.ERROR && (
        <div className={styles.fileItemError}>
          <p><strong>Erreur de parsing :</strong> {file.parsing_error || 'Une erreur inconnue est survenue.'}</p>
          <button onClick={() => onReparse(file.id)}>Relancer le traitement</button>
        </div>
      )}

      <FilePreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileId={file.id}
        filename={file.filename_original}
      />
    </li>
  );
};