import React from 'react'
import { useOperations, useDictionaries } from '../../hooks';
import styles from './OperationEditor.module.scss';

export interface Operation {
  op: string;
  [key: string]: any;
}

interface OperationEditorProps {
  operation: Operation;
  onOperationChange: (operation: Operation) => void;
  onRemove: () => void;
}

export function OperationEditor({
  operation,
  onOperationChange,
  onRemove
}: OperationEditorProps) {
  const { operations, loading, error } = useOperations();
  const { dictionaries, loading: dictLoading, error: dictError } = useDictionaries();

  // Connaître les ops "typées" pour savoir quand activer le fallback générique
  const KNOWN_OPS = React.useMemo(
    () => new Set(['cast','regex_replace','date_parse','dict','sort','slice','filter','unique']),
    []
  );

  // Etat local pour le textarea des ops génériques
  const [genericText, setGenericText] = React.useState('');
  const [isEditingGeneric, setIsEditingGeneric] = React.useState(false);
  
  React.useEffect(() => {
    // On ne (re)génère le texte que pour les opérations génériques
    // ET uniquement si on n'est pas en train d'éditer.
    const isGeneric = !KNOWN_OPS.has(operation.op) || operation.op === 'custom_op';
    if (!isGeneric || isEditingGeneric) return;

    const text = Object.entries(operation)
      .filter(([k]) => k !== 'op')
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    setGenericText(text);
  }, [operation, KNOWN_OPS, isEditingGeneric]);

  const handleChange = (key: string, value: any) => {
    onOperationChange({ ...operation, [key]: value });
  };

  const applyGenericText = (text: string) => {
    setGenericText(text);
    // repartir de l'opération courante
    const params: Operation = { ...operation, op: operation.op };
    // nettoyer les anciennes clés
    Object.keys(params).forEach((k) => { if (k !== 'op') delete params[k]; });
    // reconstruire depuis le texte
    text.split('\n').forEach((line) => {
      const idx = line.indexOf('=');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key) params[key] = val;
      }
    });
    onOperationChange(params);
  };

  const renderOperationForm = () => {
    const { op } = operation;

    switch (op) {
      case 'cast':
        return (
          <div className={styles.operationForm}>
            <label>
              Type de conversion:
              <select
                value={operation.to || ''}
                onChange={(e) => handleChange('to', e.target.value)}
              >
                <option value="">Sélectionner un type</option>
                <option value="number">Nombre</option>
                <option value="boolean">Booléen</option>
                <option value="string">Chaîne</option>
                <option value="date">Date</option>
              </select>
            </label>
          </div>
        );

      case 'regex_replace':
        return (
          <div className={styles.operationForm}>
            <label>
              Pattern:
              <input
                type="text"
                placeholder="\\d+"
                value={operation.pattern || ''}
                onChange={(e) => handleChange('pattern', e.target.value)}
              />
            </label>
            <label>
              Remplacement:
              <input
                type="text"
                placeholder=""
                value={operation.replacement || ''}
                onChange={(e) => handleChange('replacement', e.target.value)}
              />
            </label>
            <label>
              Flags:
              <input
                type="text"
                placeholder="g, i, m, s"
                value={operation.flags || ''}
                onChange={(e) => handleChange('flags', e.target.value)}
              />
            </label>
          </div>
        );

      case 'date_parse':
        return (
          <div className={styles.operationForm}>
            <label>
              Formats de date:
              <div className={styles.chipInput}>
                {(operation.formats || ['']).map((format: string, index: number) => (
                  <div key={index} className={styles.chip}>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={format}
                      onChange={(e) => {
                        const newFormats = [...(operation.formats || [''])];
                        newFormats[index] = e.target.value;
                        handleChange('formats', newFormats);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFormats = (operation.formats || ['']).filter((_: string, i: number) => i !== index);
                        handleChange('formats', newFormats.length ? newFormats : ['']);
                      }}
                      className={styles.removeChip}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newFormats = [...(operation.formats || ['']), ''];
                    handleChange('formats', newFormats);
                  }}
                  className={styles.addChip}
                >
                  + Format
                </button>
              </div>
            </label>
            <label>
              Fuseau horaire par défaut:
              <input
                type="text"
                placeholder="Europe/Paris"
                value={operation.assume_tz || ''}
                onChange={(e) => handleChange('assume_tz', e.target.value)}
              />
            </label>
          </div>
        );

      case 'dict':
        return (
          <div className={styles.operationForm}>
            <label>
              Nom du dictionnaire:
              <select
                value={operation.key || ''}
                onChange={(e) => handleChange('key', e.target.value)}
                disabled={dictLoading}
              >
                <option value="">Sélectionner un dictionnaire</option>
                {dictLoading ? (
                  <option disabled>Chargement...</option>
                ) : dictError ? (
                  <option disabled>Erreur de chargement</option>
                ) : (
                  dictionaries.map(dict => (
                    <option key={dict.id} value={dict.id}>
                      {dict.name}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        );

      case 'sort':
        return (
          <div className={styles.operationForm}>
            <label>
              Champ de tri:
              <input
                type="text"
                placeholder="nom_du_champ"
                value={operation.by || ''}
                onChange={(e) => handleChange('by', e.target.value)}
              />
            </label>
            <label>
              Ordre:
              <select
                value={operation.order || 'asc'}
                onChange={(e) => handleChange('order', e.target.value)}
              >
                <option value="asc">Croissant (A→Z)</option>
                <option value="desc">Décroissant (Z→A)</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={operation.numeric || false}
                onChange={(e) => handleChange('numeric', e.target.checked)}
              />
              Tri numérique
            </label>
          </div>
        );

      case 'slice':
        return (
          <div className={styles.operationForm}>
            <label>
              Début:
              <input
                type="number"
                placeholder="0"
                value={operation.start || ''}
                onChange={(e) => handleChange('start', parseInt(e.target.value) || 0)}
              />
            </label>
            <label>
              Fin:
              <input
                type="number"
                placeholder="10"
                value={operation.end || ''}
                onChange={(e) => handleChange('end', parseInt(e.target.value) || 10)}
              />
            </label>
          </div>
        );

      case 'filter':
        return (
          <div className={styles.operationForm}>
            <label>
              Condition:
              <select
                value={operation.condition || 'not_empty'}
                onChange={(e) => handleChange('condition', e.target.value)}
              >
                <option value="not_empty">Non vide</option>
                <option value="equals">Égal à</option>
                <option value="contains">Contient</option>
                <option value="regex">Expression régulière</option>
                <option value="range">Dans la plage</option>
              </select>
            </label>
            {operation.condition === 'equals' && (
              <label>
                Valeur:
                <input
                  type="text"
                  placeholder="valeur_à_égaler"
                  value={operation.value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                />
              </label>
            )}
            {operation.condition === 'contains' && (
              <label>
                Texte à contenir:
                <input
                  type="text"
                  placeholder="texte_recherché"
                  value={operation.value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                />
              </label>
            )}
            {operation.condition === 'regex' && (
              <label>
                Pattern regex:
                <input
                  type="text"
                  placeholder="\\d+"
                  value={operation.value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                />
              </label>
            )}
            {operation.condition === 'range' && (
              <>
                <label>
                  Minimum:
                  <input
                    type="number"
                    placeholder="0"
                    value={operation.min || ''}
                    onChange={(e) => handleChange('min', parseFloat(e.target.value) || 0)}
                  />
                </label>
                <label>
                  Maximum:
                  <input
                    type="number"
                    placeholder="100"
                    value={operation.max || ''}
                    onChange={(e) => handleChange('max', parseFloat(e.target.value) || 100)}
                  />
                </label>
              </>
            )}
          </div>
        );

      case 'unique':
        return (
          <div className={styles.operationForm}>
            <label>
              Propriété de déduplication:
              <input
                type="text"
                placeholder="email"
                value={operation.by || ''}
                onChange={(e) => handleChange('by', e.target.value)}
              />
            </label>
          </div>
        );

      default:
        // Fallback pour les opérations non typées - formulaire k=v générique
        return (
          <div className={styles.operationForm}>
            <label>
              Paramètres (format clé=valeur):
              <textarea
                placeholder="param1=value1&#10;param2=value2"
                value={genericText}
                onFocus={() => setIsEditingGeneric(true)}
                onBlur={(e) => { setIsEditingGeneric(false); applyGenericText(e.target.value); }}
                onChange={(e) => applyGenericText(e.target.value)}
                rows={3}
              />
            </label>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement des opérations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.operationEditor}>
      <div className={styles.operationHeader}>
        <select
          value={operation.op || ''}
          onChange={(e) => handleChange('op', e.target.value)}
          className={styles.operationSelect}
        >
          <option value="">Sélectionner une opération</option>
          {operations.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
          {/* Ajouter l'opération actuelle si elle n'est pas dans la liste standard */}
          {operation.op && !operations.includes(operation.op) && (
            <option key={operation.op} value={operation.op}>
              {operation.op}
            </option>
          )}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className={styles.removeButton}
        >
          ×
        </button>
      </div>

      {operation.op && (
        <div className={styles.operationContent}>
          {renderOperationForm()}
        </div>
      )}
    </div>
  );
}
