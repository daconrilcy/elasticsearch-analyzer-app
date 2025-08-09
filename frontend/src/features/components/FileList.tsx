import React from 'react';
import section from './FileList.module.scss'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { FileDetail, FileOut } from '../../types/api.v1';
import { deleteFile, reparseFile } from '../apiClient';
import { FileListItem } from './FileListItem';

interface FileListProps {
  datasetId: string;
  files: FileDetail[];
  onCreateMapping: (file: FileOut) => void;
}

export const FileList: React.FC<FileListProps> = ({ datasetId, files, onCreateMapping }) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: () => {
      toast.success('Fichier supprimé.');
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

  if (!files.length) {
    return (
      <section className={section.filesSection}>
        <h3>Fichiers</h3>
        <p>Aucun fichier n'a été uploadé dans ce dataset.</p>
      </section>
    );
  }

  return (
    <section className={section.filesSection}>
      <h3>Fichiers</h3>
      <ul>
        {files.map((file) => (
          <FileListItem 
            key={file.id} 
            file={file}
            onDelete={deleteMutation.mutate}
            onReparse={reparseMutation.mutate}
            onCreateMapping={onCreateMapping}
          />
        ))}
      </ul>
    </section>
  );
};