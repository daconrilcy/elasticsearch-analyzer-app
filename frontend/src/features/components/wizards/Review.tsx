import React, { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';

/**
 * Composant pour la dernière étape de validation avant l'ingestion.
 * Affiche un résumé complet de la configuration et demande à l'utilisateur
 * de nommer son index avant de lancer le processus.
 */
export const Review: React.FC = () => {
  const { 
    file,
    mapping, 
    indexName, 
    setIndexName, 
    startIngestion, 
    setIngestionSuccess, 
    setIngestionError,
    setStep 
  } = useWizardStore();

  const [error, setError] = useState<string | null>(null);

  /**
   * Gère le lancement du processus d'ingestion.
   */
  const handleStartProcess = () => {
    // Validation simple du nom de l'index
    if (!indexName.trim()) {
      setError("Veuillez donner un nom à votre index.");
      return;
    }
    setError(null);
    
    // Déclenche l'état d'ingestion dans le store
    startIngestion();

    // --- Simulation d'un appel API asynchrone ---
    // Dans une application réelle, ici se trouverait l'appel à votre backend.
    console.log("Lancement du processus pour l'index:", indexName);
    console.log("Fichier:", file?.name);
    console.log("Mapping final:", mapping);

    setTimeout(() => {
      // Simulation d'une réussite ou d'un échec de manière aléatoire
      if (Math.random() > 0.3) { // 70% de chance de succès
        setIngestionSuccess();
      } else {
        setIngestionError("Échec du parsing du fichier. Le format de la colonne 'date' est invalide à la ligne 42.");
      }
    }, 3000); // Simule un délai de 3 secondes
  };

  return (
    <div className="review-container">
      <h2>Étape 3: Révision et Lancement</h2>
      <p>Vérifiez la configuration finale avant de créer l'index et d'importer vos données.</p>
      
      {/* Section pour nommer l'index */}
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
        />
        {error && <p className="error-text">{error}</p>}
      </div>

      {/* Section pour le résumé du mapping */}
      <div className="review-section">
        <h3>2. Résumé du Mapping</h3>
        <p className="section-description">
          Voici le mapping qui sera appliqué à votre index.
        </p>
        <pre className="mapping-summary">
          {JSON.stringify({ properties: mapping }, null, 2)}
        </pre>
      </div>
      
      {/* Boutons d'action */}
      <div className="wizard-actions">
        <button onClick={() => setStep('mapping')} className="button-secondary">
          Retour
        </button>
        <button onClick={handleStartProcess} className="button-success">
          Lancer la Création et l'Ingestion
        </button>
      </div>
    </div>
  );
};
