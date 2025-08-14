import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';

export interface SchemaInfo {
  schema: any;
  fieldTypes: string[];
  operations: string[];
  version: string;
  loading: boolean;
  error: string | null;
  offline: boolean;
  updated: boolean;
  etag: string | null;
  reload: (force?: boolean) => Promise<void>;
}

// Cache local pour le schéma
const schemaCache = {
  data: null as any,
  etag: null as string | null,
  timestamp: 0,
};

export function useSchema(): SchemaInfo {
  const [schema, setSchema] = useState<any>(null);
  const [fieldTypes, setFieldTypes] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [version, setVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [etag, setEtag] = useState<string | null>(null);

  // Fonction de rechargement du schéma
  const reload = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      setOffline(false);

      // Utiliser le cache si disponible et pas de force reload
      const currentEtag = force ? undefined : schemaCache.etag || undefined;
      
      const result = await api.getSchema(currentEtag);
      
      if (result.status === 304) {
        // Pas de changement, utiliser le cache
        if (schemaCache.data) {
          setSchema(schemaCache.data);
          setEtag(schemaCache.etag);
          setUpdated(false);
        }
      } else if (result.status === 200) {
        // Nouveau schéma
        const newSchema = result.data;
        const newEtag = result.etag;
        
        // Mettre à jour le cache
        schemaCache.data = newSchema;
        schemaCache.etag = newEtag;
        schemaCache.timestamp = Date.now();
        
        setSchema(newSchema);
        setEtag(newEtag);
        setUpdated(Boolean(currentEtag && currentEtag !== newEtag));
        
        // Extraire la version
        const schemaVersion = newSchema?.$id?.split('/').pop()?.replace('.schema.json', '') || 'unknown';
        setVersion(schemaVersion);
        
        // Extraire les types de champs (exclure nested/object gérés via containers)
        const allFieldTypes = newSchema?.properties?.fields?.items?.properties?.type?.enum || [];
        const filteredFieldTypes = allFieldTypes.filter((type: string) => 
          !['nested', 'object'].includes(type)
        );
        setFieldTypes(filteredFieldTypes);
        
        // Extraire les opérations disponibles
        const opsRefs = newSchema?.properties?.fields?.items?.properties?.pipeline?.items?.oneOf || [];
        const ops = opsRefs
          .map((ref: any) => {
            const opName = ref?.$ref?.split('/').pop()?.replace('Op', '');
            return opName;
          })
          .filter(Boolean)
          .map((op: string) => op.charAt(0).toLowerCase() + op.slice(1)); // camelCase
        
        // Validation et fallback des opérations
        if (ops.length === 0) {
          console.warn('Aucune opération trouvée dans le schéma, utilisation des opérations par défaut');
          const defaultOps = ['trim', 'cast', 'map', 'filter', 'sort'];
          setOperations(defaultOps);
        } else {
          setOperations(ops);
        }
      }
    } catch (err) {
      console.error('Schema loading error:', err);
      
      // Gestion offline
      if (err instanceof Error && err.message.includes('fetch')) {
        setOffline(true);
        
        // Essayer de charger depuis le cache si disponible
        if (schemaCache.data) {
          setSchema(schemaCache.data);
          setEtag(schemaCache.etag);
          setError('Mode hors ligne - schéma chargé depuis le cache');
        } else {
          setError('Mode hors ligne - aucun schéma en cache disponible');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load schema');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    schema,
    fieldTypes,
    operations,
    version,
    loading,
    error,
    offline,
    updated,
    etag,
    reload,
  };
}

// Hook spécialisé pour les types de champs
export function useFieldTypes(): { fieldTypes: string[]; loading: boolean; error: string | null; offline: boolean } {
  const { fieldTypes, loading, error, offline } = useSchema();
  return { fieldTypes, loading, error, offline };
}

// Hook spécialisé pour les opérations
export function useOperations(): { operations: string[]; loading: boolean; error: string | null; offline: boolean } {
  const { operations, loading, error, offline } = useSchema();
  return { operations, loading, error, offline };
}

// Hook pour la version du schéma
export function useSchemaVersion(): { version: string; loading: boolean; error: string | null; offline: boolean } {
  const { version, loading, error, offline } = useSchema();
  return { version, loading, error, offline };
}

