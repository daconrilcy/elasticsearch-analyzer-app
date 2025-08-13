import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styles from './MappingApply.module.scss';

interface MappingApplyProps {
  mapping: any;
  compiledHash?: string;
  onApplyComplete?: (result: ApplyResponse) => void;
}

interface ApplyResponse {
  success: boolean;
  index_name: string;
  pipeline_name: string;
  ilm_policy_name?: string;
  status: 'created' | 'updated' | 'failed';
  message: string;
  processing_time_ms: number;
  details: {
    index_created: boolean;
    pipeline_created: boolean;
    ilm_policy_created?: boolean;
    shards: number;
    replicas: number;
    settings: Record<string, any>;
  };
}

async function applyMapping(mapping: any, compiledHash?: string): Promise<ApplyResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mapping,
      compiled_hash: compiledHash,
      options: {
        create_index: true,
        create_pipeline: true,
        create_ilm_policy: true,
        wait_for_active_shards: 1
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply mapping: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function MappingApply({ mapping, compiledHash, onApplyComplete }: MappingApplyProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [indexName, setIndexName] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [shards, setShards] = useState(1);
  const [replicas, setReplicas] = useState(1);

  const applyMutation = useMutation({
    mutationFn: (params: { mapping: any; compiledHash?: string }) =>
      applyMapping(params.mapping, params.compiledHash),
    onSuccess: (data) => {
      console.log('Apply results:', data);
      onApplyComplete?.(data);
    },
    onError: (error) => {
      console.error('Erreur lors de l\'application:', error);
    },
  });

  const handleApply = () => {
    if (!mapping) return;
    
    // Générer des noms par défaut si non fournis
    const finalIndexName = indexName || `index_${Date.now()}`;
    const finalPipelineName = pipelineName || `pipeline_${Date.now()}`;
    
    // Mettre à jour le mapping avec les noms
    const mappingWithNames = {
      ...mapping,
      index_name: finalIndexName,
      pipeline_name: finalPipelineName,
      settings: {
        ...mapping.settings,
        number_of_shards: shards,
        number_of_replicas: replicas
      }
    };
    
    applyMutation.mutate({ mapping: mappingWithNames, compiledHash });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return '✅';
      case 'updated':
        return '🔄';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return styles.statusCreated;
      case 'updated':
        return styles.statusUpdated;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusUnknown;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created':
        return 'Créé';
      case 'updated':
        return 'Mis à jour';
      case 'failed':
        return 'Échec';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className={styles.mappingApply}>
      <div className={styles.header}>
        <h3>Application du Mapping</h3>
        <div className={styles.headerActions}>
          {applyMutation.data && (
            <div className={styles.applySummary} data-testid="apply-summary">
              <span className={`${styles.summaryItem} ${getStatusColor(applyMutation.data.status)}`}>
                {getStatusIcon(applyMutation.data.status)} {getStatusLabel(applyMutation.data.status)}
              </span>
              <span className={styles.summaryItem}>
                {applyMutation.data.processing_time_ms}ms
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.expandButton}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.info}>
            <p>
              Déployez votre mapping en créant l'index Elasticsearch, le pipeline d'ingestion 
              et la politique ILM. Cette action rendra votre mapping opérationnel.
            </p>
          </div>

          <div className={styles.configuration}>
            <h4>Configuration de l'Index</h4>
            <div className={styles.configGrid}>
              <div className={styles.configItem}>
                <label htmlFor="index-name">Nom de l'index:</label>
                <input
                  id="index-name"
                  type="text"
                  placeholder="mon_index"
                  value={indexName}
                  onChange={(e) => setIndexName(e.target.value)}
                  className={styles.configInput}
                />
              </div>
              
              <div className={styles.configItem}>
                <label htmlFor="pipeline-name">Nom du pipeline:</label>
                <input
                  id="pipeline-name"
                  type="text"
                  placeholder="mon_pipeline"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className={styles.configInput}
                />
              </div>

              <div className={styles.configItem}>
                <label htmlFor="shards">Nombre de shards:</label>
                <input
                  id="shards"
                  type="number"
                  min="1"
                  max="100"
                  value={shards}
                  onChange={(e) => setShards(parseInt(e.target.value) || 1)}
                  className={styles.configInput}
                />
              </div>

              <div className={styles.configItem}>
                <label htmlFor="replicas">Nombre de réplicas:</label>
                <input
                  id="replicas"
                  type="number"
                  min="0"
                  max="10"
                  value={replicas}
                  onChange={(e) => setReplicas(parseInt(e.target.value) || 0)}
                  className={styles.configInput}
                />
              </div>
            </div>
          </div>

          {compiledHash && (
            <div className={styles.compiledHash}>
              <p>
                <strong>Hash de compilation:</strong> {compiledHash}
              </p>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleApply}
              disabled={applyMutation.isPending || !mapping}
              className={styles.applyButton}
            >
              {applyMutation.isPending ? 'Application en cours...' : 'Appliquer le Mapping'}
            </button>
          </div>

          {applyMutation.isError && (
            <div className={styles.error}>
              <p>Erreur lors de l'application:</p>
              <p>{applyMutation.error?.message}</p>
            </div>
          )}

          {applyMutation.data && (
            <div className={styles.results} data-testid="apply-results">
              <div className={styles.summary}>
                <h4>Résultats de l'Application</h4>
                <div className={styles.summaryDetails}>
                  <p>
                    <strong>Statut:</strong>{' '}
                    <span className={`${styles.status} ${getStatusColor(applyMutation.data.status)}`}>
                      {getStatusIcon(applyMutation.data.status)} {getStatusLabel(applyMutation.data.status)}
                    </span>
                  </p>
                  <p>
                    <strong>Index:</strong> {applyMutation.data.index_name}
                  </p>
                  <p>
                    <strong>Pipeline:</strong> {applyMutation.data.pipeline_name}
                  </p>
                  {applyMutation.data.ilm_policy_name && (
                    <p>
                      <strong>Politique ILM:</strong> {applyMutation.data.ilm_policy_name}
                    </p>
                  )}
                  <p>
                    <strong>Message:</strong> {applyMutation.data.message}
                  </p>
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.detailsHeader}>
                  <h5>Détails de l'Application</h5>
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className={styles.toggleButton}
                    data-testid="toggle-details"
                  >
                    {showDetails ? 'Masquer' : 'Afficher'} les détails
                  </button>
                </div>
                
                {showDetails && (
                  <div className={styles.detailsContent} data-testid="apply-details-content">
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailCard}>
                        <div className={styles.detailIcon}>
                          {applyMutation.data.details.index_created ? '✅' : '❌'}
                        </div>
                        <div className={styles.detailText} data-testid="index-created">
                          <strong>Index créé:</strong> {applyMutation.data.details.index_created ? 'Oui' : 'Non'}
                        </div>
                      </div>
                      
                      <div className={styles.detailCard}>
                        <div className={styles.detailIcon}>
                          {applyMutation.data.details.pipeline_created ? '✅' : '❌'}
                        </div>
                        <div className={styles.detailText} data-testid="pipeline-created">
                          <strong>Pipeline créé:</strong> {applyMutation.data.details.pipeline_created ? 'Oui' : 'Non'}
                        </div>
                      </div>
                      
                      {applyMutation.data.details.ilm_policy_created !== undefined && (
                        <div className={styles.detailCard}>
                          <div className={styles.detailIcon}>
                            {applyMutation.data.details.ilm_policy_created ? '✅' : '❌'}
                          </div>
                          <div className={styles.detailText} data-testid="ilm-created">
                            <strong>Politique ILM créée:</strong> {applyMutation.data.details.ilm_policy_created ? 'Oui' : 'Non'}
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.detailCard}>
                        <div className={styles.detailIcon}>🔢</div>
                        <div className={styles.detailText} data-testid="shards">
                          <strong>Shards:</strong> {applyMutation.data.details.shards}
                        </div>
                      </div>
                      
                      <div className={styles.detailCard}>
                        <div className={styles.detailIcon}>🔄</div>
                        <div className={styles.detailText} data-testid="replicas">
                          <strong>Réplicas:</strong> {applyMutation.data.details.replicas}
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(applyMutation.data.details.settings).length > 0 && (
                      <div className={styles.settingsSection} data-testid="settings-section">
                        <h6>Paramètres de l'Index</h6>
                        <pre className={styles.settingsOutput} data-testid="settings-output">
                          <code>{JSON.stringify(applyMutation.data.details.settings, null, 2)}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {applyMutation.data.success && (
                <div className={styles.success} data-testid="apply-success">
                  <h5>🎉 Mapping Appliqué avec Succès !</h5>
                  <p>
                    Votre mapping est maintenant opérationnel. Vous pouvez commencer à ingérer des données 
                    dans l'index <strong>{applyMutation.data.index_name}</strong>.
                  </p>
                  <div className={styles.nextSteps}>
                    <h6>Prochaines étapes :</h6>
                    <ul>
                      <li>Vérifiez que l'index est visible dans Elasticsearch</li>
                      <li>Testez l'ingestion avec quelques documents</li>
                      <li>Configurez la surveillance et les alertes si nécessaire</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
