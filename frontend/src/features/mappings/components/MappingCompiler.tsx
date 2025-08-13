import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styles from './MappingCompiler.module.scss';

interface MappingCompilerProps {
  mapping: any;
  onCompilationComplete?: (compilation: CompilationResponse) => void;
}

interface CompilationResponse {
  success: boolean;
  compiled_hash: string;
  es_mapping: Record<string, any>;
  pipeline: Record<string, any>;
  processing_time_ms: number;
  warnings: string[];
  errors: string[];
}

async function compileMapping(mapping: any): Promise<CompilationResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/compile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapping),
  });

  if (!response.ok) {
    throw new Error(`Failed to compile mapping: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function MappingCompiler({ mapping, onCompilationComplete }: MappingCompilerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showESMapping, setShowESMapping] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);

  const compilationMutation = useMutation({
    mutationFn: compileMapping,
    onSuccess: (data) => {
      console.log('Compilation results:', data);
      onCompilationComplete?.(data);
    },
    onError: (error) => {
      console.error('Erreur lors de la compilation:', error);
    },
  });

  const handleCompile = () => {
    if (!mapping) return;
    compilationMutation.mutate(mapping);
  };

  const formatJSON = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // TODO: Afficher une notification de succès
      console.log(`${label} copié dans le presse-papiers`);
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
  };

  return (
    <div className={styles.mappingCompiler}>
      <div className={styles.header}>
        <h3>Compilation du Mapping</h3>
        <div className={styles.headerActions}>
          {compilationMutation.data && (
            <div className={styles.compilationSummary}>
              <span className={styles.summaryItem}>
                Hash: {compilationMutation.data.compiled_hash.substring(0, 8)}...
              </span>
              <span className={styles.summaryItem}>
                {compilationMutation.data.processing_time_ms}ms
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
              Compilez votre mapping DSL en mapping Elasticsearch et pipeline d'ingestion.
              La compilation génère un hash unique pour identifier la version du mapping.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCompile}
              disabled={compilationMutation.isPending || !mapping}
              className={styles.compileButton}
            >
              {compilationMutation.isPending ? 'Compilation en cours...' : 'Compiler le Mapping'}
            </button>
          </div>

          {compilationMutation.isError && (
            <div className={styles.error}>
              <p>Erreur lors de la compilation:</p>
              <p>{compilationMutation.error?.message}</p>
            </div>
          )}

          {compilationMutation.data && (
            <div className={styles.results}>
              <div className={styles.summary}>
                <h4>Résultats de la Compilation</h4>
                <div className={styles.summaryDetails}>
                  <div className={styles.hashSection}>
                    <strong>Hash de compilation:</strong>
                    <div className={styles.hashContainer}>
                      <code className={styles.hashValue}>
                        {compilationMutation.data.compiled_hash}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(
                          compilationMutation.data.compiled_hash, 
                          'Hash de compilation'
                        )}
                        className={styles.copyButton}
                        title="Copier le hash"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <p>
                    <strong>Temps de traitement:</strong> {compilationMutation.data.processing_time_ms}ms
                  </p>
                </div>
              </div>

              {compilationMutation.data.warnings.length > 0 && (
                <div className={styles.warnings}>
                  <h5>⚠️ Avertissements</h5>
                  <ul>
                    {compilationMutation.data.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {compilationMutation.data.errors.length > 0 && (
                <div className={styles.errors}>
                  <h5>❌ Erreurs</h5>
                  <ul>
                    {compilationMutation.data.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.outputSections}>
                <div className={styles.outputSection}>
                  <div className={styles.outputHeader}>
                    <h5>Mapping Elasticsearch</h5>
                    <div className={styles.outputActions}>
                      <button
                        type="button"
                        onClick={() => setShowESMapping(!showESMapping)}
                        className={styles.toggleButton}
                      >
                        {showESMapping ? 'Masquer' : 'Afficher'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(
                          formatJSON(compilationMutation.data.es_mapping),
                          'Mapping Elasticsearch'
                        )}
                        className={styles.copyButton}
                        title="Copier le mapping"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  {showESMapping && (
                    <div className={styles.outputContent}>
                      <pre className={styles.jsonOutput}>
                        <code>{formatJSON(compilationMutation.data.es_mapping)}</code>
                      </pre>
                    </div>
                  )}
                </div>

                <div className={styles.outputSection}>
                  <div className={styles.outputHeader}>
                    <h5>Pipeline d'Ingestion</h5>
                    <div className={styles.outputActions}>
                      <button
                        type="button"
                        onClick={() => setShowPipeline(!showPipeline)}
                        className={styles.toggleButton}
                      >
                        {showPipeline ? 'Masquer' : 'Afficher'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(
                          formatJSON(compilationMutation.data.pipeline),
                          'Pipeline d\'ingestion'
                        )}
                        className={styles.copyButton}
                        title="Copier le pipeline"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  {showPipeline && (
                    <div className={styles.outputContent}>
                      <pre className={styles.jsonOutput}>
                        <code>{formatJSON(compilationMutation.data.pipeline)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.nextSteps}>
                <h5>Prochaines étapes</h5>
                <div className={styles.stepsList}>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>
                      Vérifiez que le mapping Elasticsearch correspond à vos attentes
                    </span>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepText}>
                      Validez le pipeline d'ingestion pour les transformations
                    </span>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>3</span>
                    <span className={styles.stepText}>
                      Utilisez le hash de compilation pour déployer l'index
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
