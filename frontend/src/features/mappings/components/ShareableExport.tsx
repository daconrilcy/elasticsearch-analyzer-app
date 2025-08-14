import React, { useState } from 'react';
import styles from './ShareableExport.module.scss';

interface MappingDSL {
  name: string;
  description: string;
  mapping: any;
  operations: any[];
  sample_data?: any[];
  metadata: {
    version: string;
    created_at: string;
    author: string;
    tags: string[];
  };
}

interface ShareableExportProps {
  mappingDSL: MappingDSL;
  onExport?: (exportData: any) => void;
  className?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  extension: string;
  mimeType: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Format JSON standard avec métadonnées',
    icon: '📄',
    extension: '.json',
    mimeType: 'application/json'
  },
  {
    id: 'yaml',
    name: 'YAML',
    description: 'Format YAML lisible et compact',
    icon: '📝',
    extension: '.yml',
    mimeType: 'text/yaml'
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    description: 'Format natif Elasticsearch',
    icon: '🔍',
    extension: '.es',
    mimeType: 'application/json'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Documentation en Markdown',
    icon: '📚',
    extension: '.md',
    mimeType: 'text/markdown'
  }
];

/**
 * Composant d'export shareable pour les DSL et samples
 * Supporte gist, URL signée et multiples formats
 */
export const ShareableExport: React.FC<ShareableExportProps> = ({
  mappingDSL,
  onExport,
  className = ''
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [includeSample, setIncludeSample] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [shareMethod, setShareMethod] = useState<'download' | 'gist' | 'url'>('download');
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string>('');
  const [gistUrl, setGistUrl] = useState<string>('');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = prepareExportData();
      
      switch (shareMethod) {
        case 'download':
          downloadFile(exportData);
          break;
        case 'gist':
          await createGist(exportData);
          break;
        case 'url':
          await createShareableUrl(exportData);
          break;
      }
      
      onExport?.(exportData);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const prepareExportData = () => {
    const format = EXPORT_FORMATS.find(f => f.id === selectedFormat);
    if (!format) throw new Error('Format non supporté');

    let content: any = {
      name: mappingDSL.name,
      description: mappingDSL.description,
      mapping: mappingDSL.mapping,
      operations: mappingDSL.operations
    };

    if (includeSample && mappingDSL.sample_data) {
      content.sample_data = mappingDSL.sample_data;
    }

    if (includeMetadata) {
      content.metadata = mappingDSL.metadata;
    }

    // Formater selon le type sélectionné
    switch (format.id) {
      case 'yaml':
        return convertToYAML(content);
      case 'elasticsearch':
        return convertToElasticsearch(content);
      case 'markdown':
        return convertToMarkdown(content);
      default:
        return JSON.stringify(content, null, 2);
    }
  };

  const convertToYAML = (data: any): string => {
    // Conversion simple vers YAML (pour l'exemple)
    const yamlLines: string[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        yamlLines.push(`${key}:`);
        yamlLines.push(`  ${JSON.stringify(value, null, 2).split('\n').join('\n  ')}`);
      } else {
        yamlLines.push(`${key}: ${value}`);
      }
    });
    
    return yamlLines.join('\n');
  };

  const convertToElasticsearch = (data: any): string => {
    // Format spécifique Elasticsearch
    const esFormat = {
      index: {
        mappings: data.mapping,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        }
      },
      pipeline: data.operations,
      sample_data: data.sample_data || []
    };
    
    return JSON.stringify(esFormat, null, 2);
  };

  const convertToMarkdown = (data: any): string => {
    const mdLines: string[] = [];
    
    mdLines.push(`# ${data.name}`);
    mdLines.push('');
    mdLines.push(data.description);
    mdLines.push('');
    
    if (data.metadata) {
      mdLines.push('## Métadonnées');
      mdLines.push(`- **Version** : ${data.metadata.version}`);
      mdLines.push(`- **Créé le** : ${data.metadata.created_at}`);
      mdLines.push(`- **Auteur** : ${data.metadata.author}`);
      mdLines.push(`- **Tags** : ${data.metadata.tags.join(', ')}`);
      mdLines.push('');
    }
    
    mdLines.push('## Mapping');
    mdLines.push('```json');
    mdLines.push(JSON.stringify(data.mapping, null, 2));
    mdLines.push('```');
    mdLines.push('');
    
    mdLines.push('## Opérations');
    mdLines.push('```json');
    mdLines.push(JSON.stringify(data.operations, null, 2));
    mdLines.push('```');
    
    if (data.sample_data) {
      mdLines.push('');
      mdLines.push('## Données d\'exemple');
      mdLines.push('```json');
      mdLines.push(JSON.stringify(data.sample_data, null, 2));
      mdLines.push('```');
    }
    
    return mdLines.join('\n');
  };

  const downloadFile = (content: string) => {
    const format = EXPORT_FORMATS.find(f => f.id === selectedFormat);
    if (!format) return;

    const blob = new Blob([content], { type: format.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mappingDSL.name}${format.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createGist = async (content: string) => {
    // Simulation de création de gist GitHub
    // En production, utilisez l'API GitHub
    const gistData = {
      description: `Mapping Studio DSL: ${mappingDSL.name}`,
      public: true,
      files: {
        [`${mappingDSL.name}${EXPORT_FORMATS.find(f => f.id === selectedFormat)?.extension}`]: {
          content: content
        }
      }
    };

    // Simuler la création
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockGistUrl = `https://gist.github.com/mock/${Math.random().toString(36).substr(2, 9)}`;
    setGistUrl(mockGistUrl);
    
    // Copier l'URL dans le presse-papiers
    navigator.clipboard.writeText(mockGistUrl);
  };

  const createShareableUrl = async (content: string) => {
    // Simulation de création d'URL signée
    // En production, utilisez votre backend pour signer les URLs
    const encodedContent = btoa(encodeURIComponent(content));
    const mockUrl = `${window.location.origin}/shared/${encodedContent}?t=${Date.now()}`;
    
    setExportUrl(mockUrl);
    
    // Copier l'URL dans le presse-papiers
    navigator.clipboard.writeText(mockUrl);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* En-tête */}
      <div className={styles.header}>
        <h3>📤 Export Shareable</h3>
        <p>Exportez votre mapping DSL dans différents formats et partagez-le facilement</p>
      </div>

      {/* Configuration de l'export */}
      <div className={styles.configSection}>
        <h4>⚙️ Configuration</h4>
        
        {/* Format d'export */}
        <div className={styles.formatSelector}>
          <label>Format d'export :</label>
          <div className={styles.formatGrid}>
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                className={`${styles.formatButton} ${selectedFormat === format.id ? styles.active : ''}`}
                onClick={() => setSelectedFormat(format.id)}
                aria-pressed={selectedFormat === format.id}
                aria-label={`Format ${format.name}`}
                data-testid={`format-${format.id}`}
              >
                <span className={styles.formatIcon}>{format.icon}</span>
                <span className={styles.formatName}>{format.name}</span>
                <span className={styles.formatDesc}>{format.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Options d'export */}
        <div className={styles.exportOptions}>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeSample}
              onChange={(e) => setIncludeSample(e.target.checked)}
            />
            Inclure les données d'exemple
          </label>
          
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
            />
            Inclure les métadonnées
          </label>
        </div>

        {/* Méthode de partage */}
        <div className={styles.shareMethod}>
          <label>Méthode de partage :</label>
          <div className={styles.shareButtons}>
            <button
              className={`${styles.shareButton} ${shareMethod === 'download' ? styles.active : ''}`}
              onClick={() => setShareMethod('download')}
              aria-pressed={shareMethod === 'download'}
              aria-label="Méthode de partage Télécharger"
            >
              💾 Télécharger
            </button>
            <button
              className={`${styles.shareButton} ${shareMethod === 'gist' ? styles.active : ''}`}
              onClick={() => setShareMethod('gist')}
              aria-pressed={shareMethod === 'gist'}
              aria-label="Méthode de partage Créer un Gist"
            >
              📝 Créer un Gist
            </button>
            <button
              className={`${styles.shareButton} ${shareMethod === 'url' ? styles.active : ''}`}
              onClick={() => setShareMethod('url')}
              aria-pressed={shareMethod === 'url'}
              aria-label="Méthode de partage URL signée"
            >
              🔗 URL signée
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu de l'export */}
      <div className={styles.previewSection}>
        <h4>👁️ Aperçu de l'export</h4>
        <div className={styles.previewContent}>
          <pre className={styles.previewCode}>
            {(() => {
              try {
                const exportData = prepareExportData();
                return typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2);
              } catch {
                return 'Aperçu non disponible';
              }
            })()}
          </pre>
        </div>
      </div>

      {/* Bouton d'export */}
      <div className={styles.exportActions}>
        <button
          className={styles.exportButton}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? '⏳ Export en cours...' : '🚀 Exporter et Partager'}
        </button>
      </div>

      {/* Résultats de l'export */}
      {(exportUrl || gistUrl) && (
        <div className={styles.exportResults}>
          <h4>✅ Export réussi !</h4>
          
          {gistUrl && (
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Gist créé :</span>
              <div className={styles.resultContent}>
                <a href={gistUrl} target="_blank" rel="noopener noreferrer" className={styles.resultLink}>
                  {gistUrl}
                </a>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(gistUrl)}
                >
                  📋 Copier
                </button>
              </div>
            </div>
          )}
          
          {exportUrl && (
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>URL partageable :</span>
              <div className={styles.resultContent}>
                <a href={exportUrl} target="_blank" rel="noopener noreferrer" className={styles.resultLink}>
                  {exportUrl}
                </a>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(exportUrl)}
                >
                  📋 Copier
                </button>
              </div>
            </div>
          )}
          
          <div className={styles.resultNote}>
            💡 L'URL a été copiée dans votre presse-papiers !
          </div>
        </div>
      )}

      {/* Informations sur les formats */}
      <div className={styles.formatInfo}>
        <h4>ℹ️ Informations sur les formats</h4>
        <div className={styles.formatDetails}>
          {EXPORT_FORMATS.map((format) => (
            <div key={format.id} className={styles.formatDetail}>
              <div className={styles.formatHeader}>
                <span className={styles.formatIcon}>{format.icon}</span>
                <span className={styles.formatName}>{format.name}</span>
              </div>
              <p>{format.description}</p>
              <div className={styles.formatMeta}>
                <span>Extension : {format.extension}</span>
                <span>Type MIME : {format.mimeType}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareableExport;
