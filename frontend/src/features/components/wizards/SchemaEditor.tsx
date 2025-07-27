import React, { useEffect, useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
// import { analyzerService } from '../../../services/analyzerService'; // Service à créer pour récupérer les analyseurs

// --- Données simulées pour les analyseurs (à remplacer par un appel API) ---
const mockAnalyzers = [
  { id: 'standard', name: 'Standard' },
  { id: 'french', name: 'Français' },
  { id: 'email_analyzer', name: 'Analyseur Email (custom)' },
];
// --- Fin de la simulation ---

const ELASTICSEARCH_TYPES = ['text', 'keyword', 'integer', 'float', 'date', 'boolean'];

export const SchemaEditor: React.FC = () => {
  const { schema, mapping, setMapping, setStep } = useWizardStore();
  const [availableAnalyzers, setAvailableAnalyzers] = useState<{id: string, name: string}[]>([]);

  // Au chargement du composant, initialiser le mapping par défaut
  // et récupérer la liste des analyseurs disponibles.
  useEffect(() => {
    // Initialise le mapping dans le store avec les types détectés par le backend.
    // Cela garantit que les menus déroulants affichent les bonnes valeurs par défaut.
    schema.forEach(field => {
        setMapping(field.field, { type: field.type });
    });

    // Simuler la récupération des analyseurs depuis le backend
    // TODO: Remplacer par un appel réel: analyzerService.getAnalyzers().then(setAvailableAnalyzers);
    setAvailableAnalyzers(mockAnalyzers);

  }, [schema, setMapping]);

  const handleTypeChange = (field: string, newType: string) => {
    const currentMapping = mapping[field];
    setMapping(field, {
      ...currentMapping,
      type: newType,
      // Si le nouveau type n'est pas 'text', on supprime l'analyseur associé
      ...(newType !== 'text' && { analyzer: undefined }),
    });
  };

  const handleAnalyzerChange = (field: string, analyzer: string) => {
    setMapping(field, { ...mapping[field], analyzer });
  };

  if (!schema || schema.length === 0) {
    return <div>Chargement du schéma ou schéma invalide...</div>;
  }

  return (
    <div className="schema-editor-container">
      <h2>Étape 2: Validez et configurez votre schéma</h2>
      <p>Nous avons détecté ce schéma. Vous pouvez le modifier avant de créer l'index.</p>
      
      <table className="schema-table">
        <thead>
          <tr>
            <th>Nom du champ</th>
            <th>Type de donnée (Elasticsearch)</th>
            <th>Analyseur (pour le type "text")</th>
          </tr>
        </thead>
        <tbody>
          {schema.map(({ field }) => (
            <tr key={field}>
              <td>{field}</td>
              <td>
                <select
                  value={mapping[field]?.type || ''}
                  onChange={(e) => handleTypeChange(field, e.target.value)}
                >
                  <option value="" disabled>Sélectionner un type</option>
                  {ELASTICSEARCH_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </td>
              <td>
                {mapping[field]?.type === 'text' && (
                  <select
                    value={mapping[field]?.analyzer || ''}
                    onChange={(e) => handleAnalyzerChange(field, e.target.value)}
                  >
                    <option value="" disabled>Choisir un analyseur</option>
                    {availableAnalyzers.map(analyzer => (
                      <option key={analyzer.id} value={analyzer.id}>
                        {analyzer.name}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="wizard-actions">
        <button onClick={() => setStep('upload')} className="button-secondary">
          Retour
        </button>
        <button onClick={() => setStep('review')} className="button-primary">
          Continuer vers la révision
        </button>
      </div>
    </div>
  );
};
