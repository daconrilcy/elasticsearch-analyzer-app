import React from 'react';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  data: Array<Record<string, any>>;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({ isOpen, onClose, filename, data }) => {
  if (!isOpen) return null;

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>Aperçu de {filename}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </header>
        <div className="modal-body">
          {data.length > 0 ? (
            <table>
              <thead>
                <tr>
                  {headers.map((header) => <th key={header}>{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => <td key={`${rowIndex}-${header}`}>{String(row[header])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun aperçu disponible pour ce fichier.</p>
          )}
        </div>
      </div>
    </div>
  );
};