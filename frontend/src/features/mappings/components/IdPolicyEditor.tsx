import { useState } from 'react';
import styles from './IdPolicyEditor.module.scss';

export interface IdPolicy {
  from: string[];
  op: 'concat';
  sep: string;
  hash?: 'sha1' | 'sha256' | 'none';
  salt?: string;
  on_conflict: 'error' | 'skip' | 'overwrite';
}

interface IdPolicyEditorProps {
  idPolicy: IdPolicy;
  onIdPolicyChange: (idPolicy: IdPolicy) => void;
  onCheckIds: () => void;
  checkingIds: boolean;
}

export function IdPolicyEditor({
  idPolicy,
  onIdPolicyChange,
  onCheckIds,
  checkingIds
}: IdPolicyEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: keyof IdPolicy, value: any) => {
    onIdPolicyChange({ ...idPolicy, [key]: value });
  };

  const addSourceColumn = () => {
    const newSources = [...idPolicy.from, ''];
    handleChange('from', newSources);
  };

  const removeSourceColumn = (index: number) => {
    const newSources = idPolicy.from.filter((_, i) => i !== index);
    handleChange('from', newSources);
  };

  const updateSourceColumn = (index: number, value: string) => {
    const newSources = [...idPolicy.from];
    newSources[index] = value;
    handleChange('from', newSources);
  };

  return (
    <div className={styles.idPolicyEditor}>
      <div className={styles.header}>
        <h3>Politique d'ID</h3>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={styles.expandButton}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.content}>
          {/* Sources d'ID */}
          <div className={styles.section}>
            <h4>Sources d'ID</h4>
            <div className={styles.sourcesList}>
              {idPolicy.from.length === 0 ? (
                <p>Aucune source d'ID définie</p>
              ) : (
                idPolicy.from.map((source, index) => (
                  <div key={index} className={styles.sourceItem}>
                    <input
                      type="text"
                      placeholder="Nom de la colonne"
                      value={source}
                      onChange={(e) => updateSourceColumn(index, e.target.value)}
                      className={styles.sourceInput}
                    />
                    <button
                      type="button"
                      onClick={() => removeSourceColumn(index)}
                      className={styles.removeSource}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={addSourceColumn}
                className={styles.addSource}
              >
                + Ajouter une source
              </button>
            </div>
          </div>

          {/* Opération de concaténation */}
          <div className={styles.section}>
            <h4>Opération de concaténation</h4>
            <div className={styles.concatConfig}>
              {idPolicy.from.length > 1 && (
                <label>
                  Séparateur:
                  <input
                    type="text"
                    placeholder=":"
                    value={idPolicy.sep}
                    onChange={(e) => handleChange('sep', e.target.value)}
                    className={styles.separatorInput}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Hachage et salage */}
          <div className={styles.section}>
            <h4>Sécurité (optionnel)</h4>
            <div className={styles.securityConfig}>
              <label>
                Algorithme de hachage:
                <select
                  value={idPolicy.hash || 'none'}
                  onChange={(e) => {
                    const hash = e.target.value === 'none' ? undefined : e.target.value as 'sha1' | 'sha256';
                    handleChange('hash', hash);
                  }}
                  className={styles.hashSelect}
                >
                  <option value="none">Aucun hachage</option>
                  <option value="sha1">SHA-1</option>
                  <option value="sha256">SHA-256</option>
                </select>
              </label>

              {idPolicy.hash && idPolicy.hash !== 'none' && (
                <label>
                  Sel (salt):
                  <input
                    type="text"
                    placeholder="v1"
                    value={idPolicy.salt || ''}
                    onChange={(e) => handleChange('salt', e.target.value)}
                    className={styles.saltInput}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Gestion des conflits */}
          <div className={styles.section}>
            <h4>Gestion des conflits</h4>
            <div className={styles.conflictConfig}>
              <label>
                En cas de doublon:
                <select
                  value={idPolicy.on_conflict}
                  onChange={(e) => handleChange('on_conflict', e.target.value as 'error' | 'skip' | 'overwrite')}
                  className={styles.conflictSelect}
                >
                  <option value="error">Erreur (arrêt)</option>
                  <option value="skip">Ignorer le doublon</option>
                  <option value="overwrite">Écraser l'existant</option>
                </select>
              </label>
            </div>
          </div>

          {/* Bouton de vérification */}
          <div className={styles.section}>
            <button
              type="button"
              onClick={onCheckIds}
              disabled={checkingIds || idPolicy.from.length === 0 || idPolicy.from.some(s => !s.trim())}
              className={styles.checkIdsButton}
            >
              {checkingIds ? (
                <>
                  <div className={styles.spinner}></div>
                  Vérification en cours...
                </>
              ) : (
                '🔍 Vérifier les IDs'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
