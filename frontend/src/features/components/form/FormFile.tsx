import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// --- Icônes (inchangées) ---
const UploadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> );
const FileIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const ClearIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

interface FormFileProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  fieldDef: {
    placeholder?: string;
    accept?: string;
    in_es?: boolean;
  };
}

export const FormFile = ({ value, onChange, fieldDef }: FormFileProps) => {
  const [inputType, setInputType] = useState<'upload' | 'path'>(
    typeof value === 'string' && value ? 'path' : 'upload'
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [serverFiles, setServerFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (Array.isArray(value) && value.length > 0 && !fileName) {
      setFileName("Fichier de règles chargé");
    } else if ((!value || value.length === 0) && fileName) {
      setFileName(null);
    }
  }, [value, fileName]);

  // --- NOUVELLE LOGIQUE : Récupération des fichiers serveur ---
  useEffect(() => {
    const fetchServerFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const response = await fetch('/api/v1/es_config_files/analysis');
        if (!response.ok) throw new Error('Impossible de charger la liste des fichiers serveur.');
        const files = await response.json();
        setServerFiles(files);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    if (inputType === 'path') {
      fetchServerFiles();
    }
  }, [inputType]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        onChange(lines);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContainerClick = () => {
    if (inputType === 'upload') fileInputRef.current?.click();
  };

  const switchInputType = (type: 'upload' | 'path') => {
    if (type !== inputType) {
        setInputType(type);
        onChange(type === 'path' ? '' : []);
    }
  }

  // --- NOUVELLE LOGIQUE : Rendu du select ou de l'upload ---
  const renderInput = () => {
    if (inputType === 'path') {
      return (
        <select
          className="file-select"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoadingFiles}
        >
          <option value="" disabled>
            {isLoadingFiles ? 'Chargement...' : 'Choisir un fichier serveur...'}
          </option>
          {serverFiles.map((file) => (
            <option key={file} value={file}>
              {file}
            </option>
          ))}
        </select>
      );
    }

    return ( // Mode 'upload'
      <div className="file-upload-container" onClick={handleContainerClick}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={fieldDef.accept} style={{ display: 'none' }} />
        {fileName ? (
          <div className="file-display"><FileIcon /><span className="file-name">{fileName}</span><button className="clear-button" onClick={handleClearFile}><ClearIcon /></button></div>
        ) : (
          <div className="file-placeholder"><UploadIcon /><span>{fieldDef.placeholder || 'Choisir ou déposer un fichier'}</span></div>
        )}
      </div>
    );
  };

  return (
    <div className="form-file-wrapper">
      {fieldDef.in_es && (
        <div className="file-input-toggle">
          <button onClick={() => switchInputType('upload')} className={`toggle-button ${inputType === 'upload' ? 'active' : ''}`}>Téléverser</button>
          <button onClick={() => switchInputType('path')} className={`toggle-button ${inputType === 'path' ? 'active' : ''}`}>Chemin du serveur</button>
        </div>
      )}
      {renderInput()}
    </div>
  );
};
