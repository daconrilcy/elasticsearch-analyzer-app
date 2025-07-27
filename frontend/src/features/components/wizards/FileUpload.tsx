import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { useWizardStore } from '../../store/wizardStore';
import { datasetService } from '../../../services/datasetService';

/**
 * Formats file size from bytes to a human-readable string (KB, MB).
 * @param bytes - The file size in bytes.
 * @returns A formatted string representing the file size.
 */
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * An SVG icon component representing the upload action.
 */
const UploadIcon: React.FC = () => (
  <svg
    className="upload-card__icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
  </svg>
);


export const FileUpload: React.FC = () => {
  const { file, setFile, setStep, setSchema, setUploadedFile, setIngestionError } = useWizardStore();
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      console.error('File rejected:', fileRejections[0].errors[0].message);
      setIngestionError(`Fichier rejeté: ${fileRejections[0].errors[0].message}`);
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile, setIngestionError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleStartUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      // Appel réel au service d'upload
      const response = await datasetService.upload(file);
      
      console.log('Upload réussi. Fichier ID:', response.file_id);
      
      // Sauvegarder l'ID du fichier et le schéma dans le store
      setUploadedFile(response.file_id);
      setSchema(response.schema);
      
      // Passer à l'étape suivante
      setStep('mapping');

    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      const errorMessage = error.message || "Une erreur est survenue lors de l'envoi du fichier.";
      setIngestionError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div {...getRootProps()} className={`upload-card ${isDragActive ? 'dropzone-active' : ''}`}>
      <input {...getInputProps()} />

      {!file ? (
        <>
          <UploadIcon />
          <div className="upload-card__text-wrapper">
            <p className="upload-card__title">Drag & drop your file here</p>
            <p className="upload-card__subtitle">(CSV, XLSX, JSON etc)</p>
          </div>
          <button type="button" className="upload-card__button" onClick={(e) => e.stopPropagation()}>
            Click to browse
          </button>
        </>
      ) : (
        <>
          <div className="upload-card__file-list">
            <div className="file-item">
              <span className="file-item__name">{file.name}</span>
              <span className="file-item__size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="file-item__remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                aria-label="Remove file"
                disabled={isLoading}
              >
                &times;
              </button>
            </div>
          </div>
          
          <button 
            type="button" 
            className="upload-card__button" 
            onClick={(e) => {
                e.stopPropagation();
                handleStartUpload();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Analyse en cours...' : 'Start Upload'}
          </button>
        </>
      )}
    </div>
  );
};
