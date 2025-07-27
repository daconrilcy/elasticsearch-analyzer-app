import React, { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { datasetService } from '../../../services/datasetService'; // Importer le service

/**
 * Composant pour la dernière étape de validation avant l'ingestion.
 */
export const Review: React.FC = () => {
  const { 
    fileId, // Récupérer l'ID du fichier depuis le store
    mapping, 
    indexName, 
    setIndexName, 
    startIngestion, 
    setIngestionError,
    setStep 
  } = useWizardStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gère le lancement du processus d'ingestion.
   */
  const handleStartProcess = async () => {
    // Validation que l'ID du fichier existe
    if (!fileId) {
      setError("Erreur critique: l'ID du fichier est manquant. Veuillez recommencer le processus d'upload.");
      return;
    }
    // Validation que le nom de l'index est rempli
    if (!indexName.trim()) {
      setError("Veuillez donner un nom à votre index.");
      return;
    }
    setError(null);
    setIsLoading(true);
    
    try {
      // Appel réel au service pour démarrer l'ingestion
      const response = await datasetService.startIngestion(fileId, indexName, mapping);
      
      // Déclencher l'état d'ingestion dans le store avec le jobId retourné par l'API
      startIngestion(response.job_id);

    } catch (err: any) {
      console.error("Erreur lors du lancement de l'ingestion:", err);
      const errorMessage = err.message || "Une erreur est survenue lors du lancement de l'ingestion.";
      setIngestionError(errorMessage);
      // En cas d'erreur au lancement (ex: l'API est indisponible), 
      // on passe quand même à l'étape d'ingestion pour y afficher le message d'erreur.
      setStep('ingesting'); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="review-container">
      <h2>Étape 3: Révision et Lancement</h2>
      <p>Vérifiez la configuration finale avant de créer l'index et d'importer vos données.</p>
      
      <div className="review-section">
        <h3>1. Nom de l'index</h3>
        <p className="section-description">
          Choisissez un nom unique pour votre nouvel index Elasticsearch.
        </p>
        <input
          type="text"
          className="form-input"
          value={indexName}
          onChange={(e) => setIndexName(e.target.value)}
          placeholder="ex: mon-index-de-produits"
          disabled={isLoading}
        />
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="review-section">
        <h3>2. Résumé du Mapping</h3>
        <p className="section-description">
          Voici le mapping qui sera appliqué à votre index.
        </p>
        <pre className="mapping-summary">
          {JSON.stringify({ properties: mapping }, null, 2)}
        </pre>
      </div>
      
      <div className="wizard-actions">
        <button onClick={() => setStep('mapping')} className="button-secondary" disabled={isLoading}>
          Retour
        </button>
        <button onClick={handleStartProcess} className="button-success" disabled={isLoading}>
          {isLoading ? "Lancement..." : "Lancer la Création et l'Ingestion"}
        </button>
      </div>
    </div>
  );
};
