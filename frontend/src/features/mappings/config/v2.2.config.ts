// Configuration du Mapping Studio V2.2

export const MAPPING_STUDIO_CONFIG = {
  // Configuration de l'API
  api: {
    baseUrl: import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1',
    timeout: 30000, // 30 secondes
    retryAttempts: 3,
    rateLimit: {
      requestsPerSecond: 5,
      burstSize: 10,
    },
  },

  // Configuration de l'interface utilisateur
  ui: {
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'fr',
    shortcuts: true,
    animations: true,
    responsive: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200,
    },
  },

  // Configuration des performances
  performance: {
    debounceDelay: 500, // 500ms
    rateLimit: 5, // 5 req/s
    virtualizationThreshold: 100, // Seuil pour la virtualisation
    cacheSize: 50, // Nombre d'éléments en cache
    maxOperations: 100, // Nombre maximum d'opérations
  },

  // Configuration des fonctionnalités
  features: {
    dragAndDrop: true,
    templates: true,
    diffView: true,
    shortcuts: true,
    toasts: true,
    schemaCache: true,
    offlineMode: true,
    virtualScrolling: true,
  },

  // Configuration des templates
  templates: {
    contacts: {
      id: 'contacts',
      name: 'Contacts',
      description: 'Gestion des contacts avec validation des emails et téléphones',
      version: '2.2',
      fields: ['id', 'email', 'phone'],
    },
    addresses: {
      id: 'addresses',
      name: 'Adresses',
      description: 'Gestion des adresses avec géocodage et validation',
      version: '2.2',
      fields: ['street', 'city', 'postal_code'],
    },
    logs: {
      id: 'logs',
      name: 'Logs',
      description: 'Gestion des logs avec parsing et indexation temporelle',
      version: '2.2',
      fields: ['timestamp', 'level', 'message'],
    },
  },

  // Configuration des raccourcis clavier
  shortcuts: {
    run: {
      key: 'Enter',
      modifier: 'cmd',
      description: 'Exécuter l\'action (validation, dry-run, etc.)',
    },
    save: {
      key: 'S',
      modifier: 'cmd',
      description: 'Sauvegarder/Exporter le mapping',
    },
    export: {
      key: 'E',
      modifier: 'cmd',
      description: 'Exporter le mapping',
    },
    validate: {
      key: 'V',
      modifier: 'cmd',
      description: 'Valider le mapping',
    },
  },

  // Configuration des toasts
  toasts: {
    defaultDuration: 5000, // 5 secondes
    maxToasts: 5,
    position: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    animation: {
      duration: 300,
      easing: 'ease-out',
    },
  },

  // Configuration du schéma
  schema: {
    cacheExpiry: 300000, // 5 minutes
    etagSupport: true,
    offlineFallback: true,
    autoReload: true,
    validation: {
      strict: true,
      showWarnings: true,
      autoValidate: false,
    },
  },

  // Configuration du drag & drop
  dragAndDrop: {
    activationConstraint: {
      distance: 8, // 8px minimum pour activer le drag
      delay: 200, // 200ms de délai
    },
    sensors: ['pointer', 'keyboard'],
    collisionDetection: 'closestCenter',
    modifiers: ['restrictToVerticalAxis'],
  },

  // Configuration de la virtualisation
  virtualization: {
    itemSize: 24, // Hauteur de chaque élément
    overscan: 5, // Nombre d'éléments à pré-rendre
    initialLimit: 100, // Limite initiale
    incrementSize: 100, // Taille de l'incrément
    maxHeight: 400, // Hauteur maximale
  },

  // Configuration des métriques
  metrics: {
    enabled: true,
    trackPerformance: true,
    trackErrors: true,
    trackUserActions: true,
    samplingRate: 0.1, // 10% des utilisateurs
  },

  // Configuration de l'accessibilité
  accessibility: {
    ariaLabels: true,
    focusVisible: true,
    keyboardNavigation: true,
    screenReaderSupport: true,
    highContrast: false,
    reducedMotion: false,
  },

  // Configuration du développement
  development: {
    debugMode: import.meta.env.DEV,
    logLevel: import.meta.env.DEV ? 'debug' : 'warn',
    performanceMonitoring: true,
    errorBoundary: true,
    hotReload: import.meta.env.DEV,
  },
} as const;

// Types pour la configuration
export type MappingStudioConfig = typeof MAPPING_STUDIO_CONFIG;

// Fonction utilitaire pour obtenir une configuration
export function getConfig<T extends keyof MappingStudioConfig>(
  key: T
): MappingStudioConfig[T] {
  return MAPPING_STUDIO_CONFIG[key];
}

// Fonction utilitaire pour vérifier si une fonctionnalité est activée
export function isFeatureEnabled(feature: keyof MappingStudioConfig['features']): boolean {
  return MAPPING_STUDIO_CONFIG.features[feature];
}

// Fonction utilitaire pour obtenir la configuration responsive
export function getResponsiveConfig() {
  return MAPPING_STUDIO_CONFIG.ui.responsive;
}

// Fonction utilitaire pour vérifier la taille de l'écran
export function getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  const { mobile, tablet } = MAPPING_STUDIO_CONFIG.ui.responsive;

  if (width <= mobile) return 'mobile';
  if (width <= tablet) return 'tablet';
  return 'desktop';
}

// Configuration par défaut pour les tests
export const TEST_CONFIG: Partial<MappingStudioConfig> = {
  api: {
    baseUrl: 'http://localhost:8000/api/v1',
    timeout: 5000,
    retryAttempts: 1,
    rateLimit: {
      requestsPerSecond: 100,
      burstSize: 100,
    },
  },
  features: {
    offlineMode: false,
    schemaCache: false,
  },
  development: {
    debugMode: true,
    logLevel: 'debug',
  },
};
