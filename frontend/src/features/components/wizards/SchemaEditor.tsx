import React, { useEffect} from 'react';
import { useWizardStore } from '../../store/wizardStore';

// --- Données simulées (à remplacer par des appels API) ---
const mockSchema = [
  { field: 'user_id', type: 'integer', score: 0.9 },
  { field: 'product_name', type: 'text', score: 0.95 },
  { field: 'purchase_date', type: 'date', score: 0.99 },
  { field: 'price', type: 'float', score: 0.8 },
];

const mockAnalyzers = [
  { id: 'standard', name: 'Standard' },
  { id: 'french', name: 'Français' },
  { id: 'email_analyzer', name: 'Analyseur Email (custom)' },
];
// --- Fin des données simulées ---

const ELASTICSEARCH_TYPES = ['text', 'keyword', 'integer', 'float', 'date', 'boolean'];

export const SchemaEditor: React.FC = () => {
  const { setSchema, schema, mapping, setMapping, setStep } = useWizardStore();

  // Simuler la récupération du schéma depuis le backend
  useEffect(() => {
    // Dans une vraie app, ce serait un appel API : api.fetchSchema(file)
    setSchema(mockSchema);
  }, [setSchema]);

  const handleTypeChange = (field: string, newType: string) => {
    // Si le nouveau type n'est pas 'text', on supprime l'analyseur associé
    const currentMapping = mapping[field];
    setMapping(field, {
      ...currentMapping,
      type: newType,
      ...(newType !== 'text' && { analyzer: undefined }),
    });
  };

  const handleAnalyzerChange = (field: string, analyzer: string) => {
    setMapping(field, { ...mapping[field], analyzer });
  };

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
                    {mockAnalyzers.map(analyzer => (
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

      <button onClick={() => setStep('review')} className="button-primary">
        Continuer vers la révision
      </button>
    </div>
  );
};