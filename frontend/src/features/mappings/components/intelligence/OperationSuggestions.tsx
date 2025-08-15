import React, { useState, useEffect } from 'react';
import styles from './OperationSuggestions.module.scss';

interface InferredField {
  field: string;
  suggested_type: string;
  confidence: number;
  sample_values: any[];
  reasoning: string;
}

interface OperationSuggestion {
  id: string;
  name: string;
  description: string;
  category: 'validation' | 'transformation' | 'enrichment' | 'quality';
  confidence: number;
  reasoning: string;
  operations: string[];
  priority: 'high' | 'medium' | 'low';
}

interface OperationSuggestionsProps {
  inferredFields: InferredField[];
  onOperationSelect?: (operation: string) => void;
  className?: string;
}

/**
 * Composant d'auto-suggestion d'opérations basé sur l'inférence de types
 * Fournit des suggestions intelligentes avec quality hints
 */
export const OperationSuggestions: React.FC<OperationSuggestionsProps> = ({
  inferredFields,
  onOperationSelect,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<OperationSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showConfidence, setShowConfidence] = useState(true);

  useEffect(() => {
    if (inferredFields.length > 0) {
      const newSuggestions = generateSuggestions(inferredFields);
      setSuggestions(newSuggestions);
    }
  }, [inferredFields]);

  const generateSuggestions = (fields: InferredField[]): OperationSuggestion[] => {
    const suggestions: OperationSuggestion[] = [];

    fields.forEach(field => {
      const fieldSuggestions = getFieldSuggestions(field);
      suggestions.push(...fieldSuggestions);
    });

    // Ajouter des suggestions globales basées sur l'ensemble des champs
    const globalSuggestions = getGlobalSuggestions(fields);
    suggestions.push(...globalSuggestions);

    // Trier par priorité et confiance
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aScore = priorityOrder[a.priority] * a.confidence;
      const bScore = priorityOrder[b.priority] * b.confidence;
      return bScore - aScore;
    });
  };

  const getFieldSuggestions = (field: InferredField): OperationSuggestion[] => {
    const suggestions: OperationSuggestion[] = [];

    // Suggestions basées sur le type inféré
    switch (field.suggested_type) {
      case 'email':
        suggestions.push({
          id: `${field.field}_email_validation`,
          name: `Validation Email - ${field.field}`,
          description: `Valider le format et la structure des emails dans ${field.field}`,
          category: 'validation',
          confidence: field.confidence * 0.9,
          reasoning: `Champ ${field.field} détecté comme email avec ${(field.confidence * 100).toFixed(0)}% de confiance`,
          operations: ['email_validation', 'domain_check', 'mx_lookup'],
          priority: 'high'
        });
        break;

      case 'phone':
        suggestions.push({
          id: `${field.field}_phone_validation`,
          name: `Validation Téléphone - ${field.field}`,
          description: `Valider et formater les numéros de téléphone dans ${field.field}`,
          category: 'validation',
          confidence: field.confidence * 0.85,
          reasoning: `Champ ${field.field} détecté comme téléphone avec ${(field.confidence * 100).toFixed(0)}% de confiance`,
          operations: ['phone_validation', 'country_detection', 'formatting'],
          priority: 'high'
        });
        break;

      case 'date':
        suggestions.push({
          id: `${field.field}_date_parsing`,
          name: `Parsing Date - ${field.field}`,
          description: `Parser et normaliser les dates dans ${field.field}`,
          category: 'transformation',
          confidence: field.confidence * 0.8,
          reasoning: `Champ ${field.field} détecté comme date avec ${(field.confidence * 100).toFixed(0)}% de confiance`,
          operations: ['date_parsing', 'format_normalization', 'timezone_handling'],
          priority: 'medium'
        });
        break;

      case 'geo_point':
        suggestions.push({
          id: `${field.field}_geocoding`,
          name: `Géocodage - ${field.field}`,
          description: `Enrichir les coordonnées géographiques dans ${field.field}`,
          category: 'enrichment',
          confidence: field.confidence * 0.75,
          reasoning: `Champ ${field.field} détecté comme point géographique avec ${(field.confidence * 100).toFixed(0)}% de confiance`,
          operations: ['reverse_geocoding', 'address_lookup', 'distance_calculation'],
          priority: 'medium'
        });
        break;

      case 'text':
        if (field.sample_values.some(v => v.length > 100)) {
          suggestions.push({
            id: `${field.field}_text_analysis`,
            name: `Analyse de Texte - ${field.field}`,
            description: `Analyser et extraire des informations du texte long dans ${field.field}`,
            category: 'enrichment',
            confidence: field.confidence * 0.7,
            reasoning: `Champ ${field.field} contient du texte long, idéal pour l'analyse`,
            operations: ['sentiment_analysis', 'keyword_extraction', 'language_detection'],
            priority: 'medium'
          });
        }
        break;
    }

    // Suggestions de qualité basées sur la confiance
    if (field.confidence < 0.7) {
      suggestions.push({
        id: `${field.field}_quality_check`,
        name: `Vérification Qualité - ${field.field}`,
        description: `Améliorer la qualité et la cohérence des données dans ${field.field}`,
        category: 'quality',
        confidence: 0.8,
        reasoning: `Confiance faible (${(field.confidence * 100).toFixed(0)}%) - nécessite une vérification`,
        operations: ['data_cleaning', 'outlier_detection', 'consistency_check'],
        priority: 'high'
      });
    }

    return suggestions;
  };

  const getGlobalSuggestions = (fields: InferredField[]): OperationSuggestion[] => {
    const suggestions: OperationSuggestion[] = [];

    // Suggestion de validation globale si plusieurs champs similaires
    const emailFields = fields.filter(f => f.suggested_type === 'email');
    if (emailFields.length > 1) {
      suggestions.push({
        id: 'global_email_consistency',
        name: 'Cohérence Globale Email',
        description: 'Vérifier la cohérence entre tous les champs email',
        category: 'quality',
        confidence: 0.9,
        reasoning: `${emailFields.length} champs email détectés - vérification de cohérence recommandée`,
        operations: ['cross_field_validation', 'domain_consistency', 'format_unification'],
        priority: 'high'
      });
    }

    // Suggestion de normalisation si types mixtes
    const hasMixedTypes = fields.some(f => f.suggested_type !== fields[0].suggested_type);
    if (hasMixedTypes) {
      suggestions.push({
        id: 'global_normalization',
        name: 'Normalisation Globale',
        description: 'Normaliser les types de données pour une meilleure cohérence',
        category: 'transformation',
        confidence: 0.8,
        reasoning: 'Types de données mixtes détectés - normalisation recommandée',
        operations: ['type_unification', 'format_standardization', 'schema_validation'],
        priority: 'medium'
      });
    }

    return suggestions;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'validation': return '✅';
      case 'transformation': return '🔄';
      case 'enrichment': return '✨';
      case 'quality': return '🔍';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  return (
    <div className={`${styles.container} ${className}`}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3>💡 Suggestions d'Opérations Intelligentes</h3>
          <p>Basé sur l'inférence de types avec quality hints</p>
        </div>

        {/* Contrôles */}
        <div className={styles.controls}>
          <label className={styles.control}>
            <input
              type="checkbox"
              checked={showConfidence}
              onChange={(e) => setShowConfidence(e.target.checked)}
            />
            Afficher la confiance
          </label>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          📋 Toutes ({suggestions.length})
        </button>
        <button
          className={`${styles.filterButton} ${selectedCategory === 'validation' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('validation')}
        >
          ✅ Validation ({suggestions.filter(s => s.category === 'validation').length})
        </button>
        <button
          className={`${styles.filterButton} ${selectedCategory === 'transformation' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('transformation')}
        >
          🔄 Transformation ({suggestions.filter(s => s.category === 'transformation').length})
        </button>
        <button
          className={`${styles.filterButton} ${selectedCategory === 'enrichment' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('enrichment')}
        >
          ✨ Enrichissement ({suggestions.filter(s => s.category === 'enrichment').length})
        </button>
        <button
          className={`${styles.filterButton} ${selectedCategory === 'quality' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('quality')}
        >
          🔍 Qualité ({suggestions.filter(s => s.category === 'quality').length})
        </button>
      </div>

      {/* Grille des suggestions */}
      <div className={styles.suggestionsGrid}>
        {filteredSuggestions.map((suggestion) => (
          <div key={suggestion.id} className={styles.suggestionCard}>
            {/* En-tête de la carte */}
            <div className={styles.cardHeader}>
              <div className={styles.categoryIcon}>
                {getCategoryIcon(suggestion.category)}
              </div>
              <div className={styles.suggestionInfo}>
                <h4>{suggestion.name}</h4>
                <p>{suggestion.description}</p>
              </div>
              <div 
                className={styles.priorityBadge}
                style={{ backgroundColor: getPriorityColor(suggestion.priority) }}
              >
                {suggestion.priority.toUpperCase()}
              </div>
            </div>

            {/* Raisonnement */}
            <div className={styles.reasoning}>
              <span className={styles.reasoningLabel}>💭 Raisonnement :</span>
              <span className={styles.reasoningText}>{suggestion.reasoning}</span>
            </div>

            {/* Opérations suggérées */}
            <div className={styles.operations}>
              <h5>🔧 Opérations suggérées :</h5>
              <div className={styles.operationsList}>
                {suggestion.operations.map((operation, index) => (
                  <button
                    key={index}
                    className={styles.operationButton}
                    onClick={() => onOperationSelect?.(operation)}
                  >
                    {operation}
                  </button>
                ))}
              </div>
            </div>

            {/* Métadonnées */}
            <div className={styles.metadata}>
              {showConfidence && (
                <div className={styles.confidence}>
                  <span className={styles.confidenceLabel}>Confiance :</span>
                  <span className={styles.confidenceValue}>
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              <div className={styles.category}>
                <span className={styles.categoryLabel}>Catégorie :</span>
                <span className={styles.categoryValue}>{suggestion.category}</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button 
                className={styles.applyButton}
                onClick={() => {
                  // Appliquer la première opération par défaut
                  if (suggestion.operations.length > 0) {
                    onOperationSelect?.(suggestion.operations[0]);
                  }
                }}
              >
                ✨ Appliquer
              </button>
              <button className={styles.detailsButton}>
                👁️ Détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucune suggestion */}
      {filteredSuggestions.length === 0 && (
        <div className={styles.noSuggestions}>
          <div className={styles.noSuggestionsIcon}>🤔</div>
          <h4>Aucune suggestion trouvée</h4>
          <p>Essayez de changer les filtres ou d'analyser plus de données</p>
        </div>
      )}
    </div>
  );
};

export default OperationSuggestions;
