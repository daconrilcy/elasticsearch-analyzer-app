import React from 'react';
import { useWizardStore } from '../features/store/wizardStore';
import { FileUpload } from '../features/components/wizards/FileUpload';
import { SchemaEditor } from '../features/components/wizards/SchemaEditor';
import { Review } from '../features/components/wizards/Review';
// Importer le futur composant de suivi
// import { IngestionProgress } from '../components/wizards/IngestionProgress';

export const ImportDataWizard: React.FC = () => {
  const { step } = useWizardStore();

  const renderCurrentStep = () => {
    switch (step) {
      case 'upload':
        return <FileUpload />;
      case 'mapping':
        return <SchemaEditor />; // ✅ Décommenté
      case 'review':
        return <Review />; // ✅ Décommenté
      case 'ingesting':
        // return <IngestionProgress />; // À construire en Phase 3
        return <div>Ingestion en cours...</div>;
      case 'complete':
        return <div>Ingestion terminée avec succès !</div>;
      default:
        return <FileUpload />;
    }
  };

  return (
    <div className="wizard-container">
      <h1>Assistant d'Intégration de Données</h1>
      <div className="wizard-content">
        {renderCurrentStep()}
      </div>
    </div>
  );
};