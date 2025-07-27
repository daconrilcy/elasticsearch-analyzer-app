import { useWizardStore } from '../../store/wizardStore';
import { useInterval } from '../../../hooks/useInterval'; // Importer le custom hook
import { datasetService } from '../../../services/datasetService'; // Importer le service

// --- Icônes SVG pour les différents états (inchangées) ---
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
  const { 
    jobId, 
    ingestionStatus, 
    error, 
    reset,
    setIngestionSuccess,
    setIngestionError 
  } = useWizardStore();

  // Définir le délai pour le polling (ex: toutes les 2 secondes)
  const POLLING_DELAY = 2000;

  // Utilisation du hook useInterval pour vérifier le statut du job
  useInterval(async () => {
    if (!jobId) {
      setIngestionError("Erreur critique: L'ID du job est manquant.");
      return; // Arrête le polling si pas de jobId
    }

    try {
      const response = await datasetService.getIngestionStatus(jobId);
      
      if (response.status === 'success') {
        setIngestionSuccess();
      } else if (response.status === 'error') {
        setIngestionError(response.detail || "Le job d'ingestion a échoué.");
      }
      // Si le statut est 'in_progress', on ne fait rien et on laisse le polling continuer.

    } catch (err: any) {
      console.error("Erreur lors de la récupération du statut:", err);
      setIngestionError(err.message || "Impossible de vérifier le statut de l'ingestion.");
    }
  }, ingestionStatus === 'in_progress' ? POLLING_DELAY : null); // Le hook ne s'active que si l'ingestion est en cours


  const renderStatus = () => {
    switch (ingestionStatus) {
      case 'in_progress':
        return (
          <>
            <LoaderIcon />
            <h2>Ingestion en cours...</h2>
            <p>Veuillez patienter pendant que nous traitons votre fichier. Cela peut prendre quelques instants.</p>
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
        // Ne rien afficher si le statut est 'idle'
        return null;
    }
  };

  return <div className="ingestion-progress-container">{renderStatus()}</div>;
};
