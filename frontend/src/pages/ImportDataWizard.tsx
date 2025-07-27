import React from 'react';
import { useWizardStore } from '../features/store/wizardStore';
import { CreateDatasetStep } from '../features/components/wizards/CreateDatasetStep'; // Importer la nouvelle étape
import { FileUpload } from '../features/components/wizards/FileUpload';
import { SchemaEditor } from '../features/components/wizards/SchemaEditor';
import { Review } from '../features/components/wizards/Review';
import { IngestionProgress } from '../features/components/wizards/IngestionProgress';

const renderCurrentStep = (step: string) => {
  switch (step) {
    case 'createDataset': // Nouvelle première étape
      return <CreateDatasetStep />;
    case 'upload':
      return <FileUpload />;
    case 'mapping':
      return <SchemaEditor />;
    case 'review':
      return <Review />;
    case 'ingesting':
    case 'complete':
      return <IngestionProgress />;
    default:
      return <CreateDatasetStep />;
  }
};

export const ImportDataWizard: React.FC = () => {
  const step = useWizardStore((state) => state.step);

  return (
    <div className="wizard-container">
      {/* Vous pouvez ajouter un composant "Stepper" ici pour montrer les étapes */}
      <div className="wizard-content">
        {renderCurrentStep(step)}
      </div>
    </div>
  );
};
