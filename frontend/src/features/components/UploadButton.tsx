import React, { useRef } from 'react';

interface UploadButtonProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onUpload, isLoading }) => {
  // useRef pour accéder à l'input de fichier caché
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Réinitialiser la valeur pour permettre de re-uploader le même fichier
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleClick = () => {
    // Déclencher le clic sur l'input caché
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} // L'input est invisible
        accept=".csv, .xlsx, .xls, .json" // Limiter les types de fichiers
      />
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Envoi en cours...' : 'Uploader un Fichier'}
      </button>
    </>
  );
};
