import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone'; // Correction: Importation de type explicite
import { useWizardStore } from '../../store/wizardStore';

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
  const { file, setFile, setStep } = useWizardStore();

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      // You can add more sophisticated error handling here (e.g., a toast notification)
      console.error('File rejected:', fileRejections[0].errors[0].message);
      return;
    }
    
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
    }
  }, [setFile]);

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

  const handleStartUpload = () => {
    if (file) {
      // Here you would typically trigger the actual API upload call.
      // For now, we just move to the next step in the wizard.
      console.log(`Starting process for ${file.name}`);
      setStep('mapping');
    }
  };

  return (
    <div {...getRootProps()} className={`upload-card ${isDragActive ? 'dropzone-active' : ''}`}>
      {/* The input is hidden but necessary for react-dropzone to work */}
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
                  e.stopPropagation(); // Prevent dropzone click event
                  handleRemoveFile();
                }}
                aria-label="Remove file"
              >
                &times;
              </button>
            </div>
          </div>
          <button type="button" className="upload-card__button" onClick={handleStartUpload}>
            Start Upload
          </button>
        </>
      )}
    </div>
  );
};
