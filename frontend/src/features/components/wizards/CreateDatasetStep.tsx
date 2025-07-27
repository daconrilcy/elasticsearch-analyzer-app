import React, { useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { datasetService } from '../../../services/datasetService';

export const CreateDatasetStep: React.FC = () => {
  const { 
    datasetName, 
    datasetDescription,
    setDatasetDetails,
    setDatasetId,
    setStep,
    setIngestionError
  } = useWizardStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!datasetName.trim()) {
      setIngestionError("Le nom du jeu de données est obligatoire.");
      return;
    }
    
    setIsLoading(true);
    // La ligne `setIngestionError(null);` a été supprimée. 
    // L'erreur est effacée implicitement par la navigation ou écrasée par une nouvelle erreur.

    try {
      const response = await datasetService.createDataset(datasetName, datasetDescription);
      console.log('Dataset créé:', response);
      
      // Sauvegarder l'ID du dataset dans le store
      setDatasetId(response.id);
      
      // Passer à l'étape suivante (upload du fichier)
      setStep('upload');

    } catch (error: any) {
      console.error("Erreur lors de la création du dataset:", error);
      setIngestionError(error.message || "Impossible de créer le jeu de données.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-dataset-container">
      <h2>Étape 1: Créez votre Jeu de Données</h2>
      <p>Donnez un nom et une description à votre projet pour organiser vos imports.</p>
      
      <div className="form-section">
        <label htmlFor="dataset-name">Nom du Jeu de Données</label>
        <input
          id="dataset-name"
          type="text"
          className="form-input"
          value={datasetName}
          onChange={(e) => setDatasetDetails({ name: e.target.value, description: datasetDescription })}
          placeholder="Ex: Données clients T3 2024"
          disabled={isLoading}
        />
      </div>

      <div className="form-section">
        <label htmlFor="dataset-description">Description (Optionnel)</label>
        <textarea
          id="dataset-description"
          className="form-textarea"
          value={datasetDescription}
          onChange={(e) => setDatasetDetails({ name: datasetName, description: e.target.value })}
          rows={3}
          placeholder="Ex: Fichier contenant les acquisitions de nouveaux clients..."
          disabled={isLoading}
        />
      </div>

      <div className="wizard-actions">
        <button onClick={handleNext} className="button-primary" disabled={isLoading}>
          {isLoading ? "Création..." : "Continuer vers l'Upload"}
        </button>
      </div>
    </div>
  );
};
