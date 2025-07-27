import React, { useEffect, useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
import { analyzerService, type Analyzer } from '../../../services/analyzerService';

const ELASTICSEARCH_TYPES = ['text', 'keyword', 'integer', 'float', 'date', 'boolean'];

export const SchemaEditor: React.FC = () => {
  const { schema, mapping, setMapping, setStep } = useWizardStore();
  const [availableAnalyzers, setAvailableAnalyzers] = useState<Analyzer[]>([]);
  const [isLoadingAnalyzers, setIsLoadingAnalyzers] = useState(true);

  useEffect(() => {
    if (Array.isArray(schema) && schema.length > 0) {
      schema.forEach(field => {
          setMapping(field.field, { type: field.type });
      });
    }

    const fetchAnalyzers = async () => {
      try {
        setIsLoadingAnalyzers(true);
        const analyzers = await analyzerService.getAnalyzers();
        setAvailableAnalyzers(analyzers);
      } catch (error) {
        console.error("Impossible de charger la liste des analyseurs:", error);
      } finally {
        setIsLoadingAnalyzers(false);
      }
    };

    fetchAnalyzers();

  }, [schema, setMapping]);

  const handleTypeChange = (field: string, newType: string) => {
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

  if (!Array.isArray(schema) || schema.length === 0) {
    return (
        <div className="schema-editor-container error-state">
            <h2>Impossible de détecter un schéma</h2>
            <p>
                Nous n'avons pas pu extraire de colonnes de votre fichier.
                Veuillez vérifier que le fichier n'est pas vide et qu'il est correctement formaté (CSV, JSON, Excel).
            </p>
            <div className="wizard-actions">
                <button onClick={() => setStep('upload')} className="button-secondary">
                    Retourner à l'upload
                </button>
            </div>
        </div>
    );
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
                    disabled={isLoadingAnalyzers}
                  >
                    <option value="" disabled>
                      {isLoadingAnalyzers ? "Chargement..." : "Choisir un analyseur"}
                    </option>
                    {/* Correction: Ajout du type explicite pour 'analyzer' */}
                    {availableAnalyzers.map((analyzer: Analyzer) => (
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

//TODO: AFFICHER ENSUITE L'APERCU DU NOUVEAU FICHIER