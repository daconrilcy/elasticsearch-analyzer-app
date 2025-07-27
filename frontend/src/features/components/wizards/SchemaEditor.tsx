import React, { useEffect, useState } from 'react';
import { useWizardStore } from '../../store/wizardStore';
// import { analyzerService } from '../../../services/analyzerService'; // Service to create for fetching analyzers

// --- Mock data for analyzers (to be replaced by an API call) ---
const mockAnalyzers = [
  { id: 'standard', name: 'Standard' },
  { id: 'french', name: 'Français' },
  { id: 'email_analyzer', name: 'Analyseur Email (custom)' },
];
// --- End of mock data ---

const ELASTICSEARCH_TYPES = ['text', 'keyword', 'integer', 'float', 'date', 'boolean'];

export const SchemaEditor: React.FC = () => {
  // The unused 'setSchema' has been removed from the destructuring
  const { schema, mapping, setMapping, setStep } = useWizardStore();
  const [availableAnalyzers, setAvailableAnalyzers] = useState<{id: string, name: string}[]>([]);

  // On component load, initialize the default mapping
  // and fetch the list of available analyzers.
  useEffect(() => {
    // Initialize the mapping in the store with the types detected by the backend.
    // This ensures the dropdowns show the correct default values.
    schema.forEach(field => {
        setMapping(field.field, { type: field.type });
    });

    // Simulate fetching analyzers from the backend
    // In a real app: analyzerService.getAnalyzers().then(setAvailableAnalyzers);
    setAvailableAnalyzers(mockAnalyzers);

  }, [schema, setMapping]);

  const handleTypeChange = (field: string, newType: string) => {
    const currentMapping = mapping[field];
    setMapping(field, {
      ...currentMapping,
      type: newType,
      // If the new type is not 'text', remove any associated analyzer
      ...(newType !== 'text' && { analyzer: undefined }),
    });
  };

  const handleAnalyzerChange = (field: string, analyzer: string) => {
    setMapping(field, { ...mapping[field], analyzer });
  };

  if (!schema || schema.length === 0) {
    return <div>Loading schema...</div>;
  }

  return (
    <div className="schema-editor-container">
      <h2>Step 2: Validate and Configure Your Schema</h2>
      <p>We've detected this schema. You can modify it before creating the index.</p>
      
      <table className="schema-table">
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Data Type (Elasticsearch)</th>
            <th>Analyzer (for "text" type)</th>
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
                  <option value="" disabled>Select a type</option>
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
                    <option value="" disabled>Choose an analyzer</option>
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
          Back
        </button>
        <button onClick={() => setStep('review')} className="button-primary">
          Continue to Review
        </button>
      </div>
    </div>
  );
};
