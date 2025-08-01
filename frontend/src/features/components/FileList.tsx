import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Importer les types et le client API avec des chemins relatifs
import type { FileOut } from '../../types/api.v1';
import { FileStatus } from '../../types/api.v1';
import { deleteFile, reparseFile } from '../apiClient';

// --- Icônes de Statut (à remplacer par votre bibliothèque d'icônes) ---
const SpinnerIcon: React.FC = () => <span title="Traitement en cours...">⏳</span>;
const ErrorIcon: React.FC = () => <span title="Une erreur est survenue">❗️</span>;
const ReadyIcon: React.FC = () => <span title="Prêt">✅</span>;

// --- Props du Composant ---
interface FileListProps {
  datasetId: string;
  files: FileOut[];
  onCreateMapping: (file: FileOut) => void;
}

export const FileList: React.FC<FileListProps> = ({ datasetId, files, onCreateMapping }) => {
  const queryClient = useQueryClient();

  // --- Mutations pour les actions sur les fichiers ---
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: () => {
      toast.success('Fichier supprimé.');
      // Rafraîchit les données du dataset après une suppression réussie
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });

  const reparseMutation = useMutation({
    mutationFn: (fileId: string) => reparseFile(fileId),
    onSuccess: () => {
      toast.success('Le parsing a été relancé.');
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });

  // --- Fonctions de Rendu ---
  const renderStatusIcon = (file: FileOut) => {
    switch (file.status) {
      case FileStatus.PARSING:
      case FileStatus.PENDING:
        return <SpinnerIcon />;
      case FileStatus.ERROR:
        // Assumons que le backend peut renvoyer un message d'erreur dans le futur
        return <ErrorIcon />;
      case FileStatus.READY:
        return <ReadyIcon />;
      default:
        return null;
    }
  };

  if (!files.length) {
    return (
      <section className="files-section">
        <h3>Fichiers</h3>
        <p>Aucun fichier n'a été uploadé dans ce dataset.</p>
      </section>
    );
  }

  return (
    <section className="files-section">
      <h3>Fichiers</h3>
      <ul>
        {files.map((file) => (
          <li key={file.id} className={`file-item status-${file.status}`}>
            <div className="file-info">
              <span className="file-status-icon">{renderStatusIcon(file)}</span>
              <span className="file-name">{file.filename_original} (v{file.version})</span>
            </div>
            <div className="file-actions">
              <button
                onClick={() => onCreateMapping(file)}
                disabled={file.status !== FileStatus.READY}
                title={file.status !== FileStatus.READY ? "Le fichier doit être prêt pour créer un mapping" : "Créer un mapping"}
              >
                Créer un Mapping
              </button>
              <button
                onClick={() => reparseMutation.mutate(file.id)}
                disabled={reparseMutation.isPending || file.status === FileStatus.PARSING}
              >
                Relancer le Parsing
              </button>
              <button
                className="delete-button"
                onClick={() => deleteMutation.mutate(file.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
