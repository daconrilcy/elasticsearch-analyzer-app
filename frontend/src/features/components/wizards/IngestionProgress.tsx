import React from 'react';
import { useWizardStore } from '../../store/wizardStore';

// --- Icônes SVG pour les différents états ---

const LoaderIcon: React.FC = () => (
  <svg className="status-icon loader" viewBox="0 0 50 50">
    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
  </svg>
);

const SuccessIcon: React.FC = () => (
  <svg className="status-icon success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
    <circle className="success-circle-bg" cx="26" cy="26" r="25" fill="none"/>
    <path className="success-checkmark" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
  </svg>
);

const ErrorIcon: React.FC = () => (
    <svg className="status-icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="error-circle-bg" cx="26" cy="26" r="25" fill="none" />
        <path className="error-line1" fill="none" d="M16 16 36 36" />
        <path className="error-line2" fill="none" d="M36 16 16 36" />
    </svg>
);


export const IngestionProgress: React.FC = () => {
  const { ingestionStatus, error, reset } = useWizardStore();

  const renderStatus = () => {
    switch (ingestionStatus) {
      case 'in_progress':
        return (
          <>
            <LoaderIcon />
            <h2>Ingestion en cours...</h2>
            <p>Veuillez patienter pendant que nous traitons votre fichier.</p>
          </>
        );
      case 'success':
        return (
          <>
            <SuccessIcon />
            <h2>Importation réussie !</h2>
            <p>Votre index a été créé et vos données ont été importées avec succès.</p>
            <button onClick={reset} className="upload-card__button">
              Importer un autre fichier
            </button>
          </>
        );
      case 'error':
        return (
          <>
            <ErrorIcon />
            <h2>Une erreur est survenue</h2>
            <p className="error-text">{error || "Une erreur inconnue s'est produite."}</p>
            <button onClick={reset} className="upload-card__button button-danger">
              Réessayer
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return <div className="ingestion-progress-container">{renderStatus()}</div>;
};