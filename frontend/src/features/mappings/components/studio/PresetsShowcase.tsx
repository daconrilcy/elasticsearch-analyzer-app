import React, { useState } from 'react';
import styles from './PresetsShowcase.module.scss';

interface Preset {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'contacts' | 'addresses' | 'logs';
    complexity: 'simple' | 'medium' | 'advanced';
    fields: number;
    operations: number;
    preview: Record<string, string>;
  }
const PRESETS: Preset[] = [
  {
    id: 'contacts',
    name: 'Contacts',
    description: 'Gestion des contacts avec validation email, téléphone et géolocalisation',
    icon: '👥',
    category: 'contacts',
    complexity: 'medium',
    fields: 12,
    operations: 8,
    preview: {
      name: 'string',
      email: 'string',
      phone: 'string',
      address: 'object',
      tags: 'array'
    }
  },
  {
    id: 'addresses',
    name: 'Adresses',
    description: 'Système d\'adresses avec géocodage et formatage international',
    icon: '📍',
    category: 'addresses',
    complexity: 'advanced',
    fields: 18,
    operations: 12,
    preview: {
      street: 'string',
      city: 'string',
      country: 'string',
      coordinates: 'geo_point',
      postal_code: 'string'
    }
  },
  {
    id: 'logs',
    name: 'Logs',
    description: 'Analyse de logs avec parsing temporel et niveaux de sévérité',
    icon: '📊',
    category: 'logs',
    complexity: 'simple',
    fields: 8,
    operations: 6,
    preview: {
      timestamp: 'date',
      level: 'string',
      message: 'text',
      source: 'string',
      metadata: 'object'
    }
  }
];

interface PresetsShowcaseProps {
  onPresetSelect?: (preset: Preset) => void;
  className?: string;
  showHeader?: boolean;
}

/**
 * Composant de présentation des presets sur la page d'accueil
 * Affiche les templates prêts à l'emploi avec aperçu et statistiques
 */
export const PresetsShowcase: React.FC<PresetsShowcaseProps> = ({
  onPresetSelect,
  className,
  showHeader = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  const filteredPresets = selectedCategory === 'all' 
    ? PRESETS 
    : PRESETS.filter(preset => preset.category === selectedCategory);

  const handlePresetClick = (preset: Preset) => {
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return '#059669';
      case 'medium': return '#d97706';
      case 'advanced': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'Facile';
      case 'medium': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return 'Inconnu';
    }
  };

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* Header affiché seulement si souhaité */}
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2>🚀 Templates Prêts à l'Emploi</h2>
            <p>Commencez rapidement avec nos presets optimisés pour les cas d'usage courants</p>
          </div>
        
        {/* Filtres par catégorie */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
            aria-label="Filtre Tous"
          >
            📋 Tous
          </button>
          <button
            className={`${styles.filterButton} ${selectedCategory === 'contacts' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('contacts')}
            aria-label="Filtre Contacts"
          >
            👥 Contacts
          </button>
          <button
            className={`${styles.filterButton} ${selectedCategory === 'addresses' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('addresses')}
            aria-label="Filtre Adresses"
          >
            📍 Adresses
          </button>
          <button
            className={`${styles.filterButton} ${selectedCategory === 'logs' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('logs')}
            aria-label="Filtre Logs"
          >
            📊 Logs
          </button>
        </div>
      </div>
      )}

      {/* Grille des presets */}
      <div className={styles.presetsGrid}>
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className={`${styles.presetCard} ${hoveredPreset === preset.id ? styles.hovered : ''}`}
            onMouseEnter={() => setHoveredPreset(preset.id)}
            onMouseLeave={() => setHoveredPreset(null)}
            onClick={() => handlePresetClick(preset)}
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir preset ${preset.name}`}
            data-testid={`preset-card-${preset.id}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePresetClick(preset);
              }
            }}
          >
            {/* En-tête de la carte */}
            <div className={styles.cardHeader}>
              <div className={styles.presetIcon}>
                {preset.icon}
              </div>
              <div className={styles.presetInfo}>
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
              </div>
              <div 
                className={styles.complexityBadge}
                style={{ backgroundColor: getComplexityColor(preset.complexity) }}
              >
                {getComplexityLabel(preset.complexity)}
              </div>
            </div>

            {/* Statistiques */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{preset.fields}</span>
                <span className={styles.statLabel}>Champs</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{preset.operations}</span>
                <span className={styles.statLabel}>Opérations</span>
              </div>
            </div>

            {/* Aperçu du schéma */}
            <div className={styles.preview}>
              <h4>📋 Aperçu du schéma</h4>
                <div className={styles.schemaPreview}>
                  {(Object.entries(preset.preview) as [string, string][])
                    .map(([field, fieldType]) => (
                      <div key={field} className={styles.fieldPreview}>
                        <span className={styles.fieldName}>{field}</span>
                        <span className={styles.fieldType}>{fieldType}</span>
                      </div>
                  ))}
                </div>
              </div>
            {/* Actions */}
            <div className={styles.actions}>
              <button className={styles.primaryButton}>
                ✨ Utiliser ce template
              </button>
              <button className={styles.secondaryButton}>
                👁️ Aperçu complet
              </button>
            </div>

            {/* Indicateur de popularité */}
            <div className={styles.popularity}>
              <span className={styles.star}>⭐</span>
              <span>Template populaire</span>
            </div>
          </div>
        ))}
      </div>

      {/* Section d'aide */}
      <div className={styles.helpSection}>
        <div className={styles.helpCard}>
          <div className={styles.helpIcon}>💡</div>
          <div className={styles.helpContent}>
            <h4>Besoin d'aide pour choisir ?</h4>
            <p>
              <strong>Contacts</strong> : Parfait pour les CRM et gestion d'utilisateurs<br/>
              <strong>Adresses</strong> : Idéal pour la géolocalisation et e-commerce<br/>
              <strong>Logs</strong> : Optimal pour la surveillance et analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetsShowcase;