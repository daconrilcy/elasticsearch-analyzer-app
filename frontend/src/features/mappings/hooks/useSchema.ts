import { useState, useEffect } from 'react';

export interface SchemaInfo {
  schema: any;
  fieldTypes: string[];
  operations: string[];
  version: string;
  loading: boolean;
  error: string | null;
}

export async function fetchSchema(): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/mappings/schema`);
  if (!res.ok) {
    throw new Error(`Failed to fetch schema: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function useSchema(): SchemaInfo {
  const [schema, setSchema] = useState<any>(null);
  const [fieldTypes, setFieldTypes] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [version, setVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchema() {
      try {
        setLoading(true);
        setError(null);
        
        const schemaData = await fetchSchema();
        setSchema(schemaData);
        
        // Extraire la version
        const schemaVersion = schemaData?.$id?.split('/').pop()?.replace('.schema.json', '') || 'unknown';
        setVersion(schemaVersion);
        
        // Extraire les types de champs (exclure nested/object gérés via containers)
        const allFieldTypes = schemaData?.properties?.fields?.items?.properties?.type?.enum || [];
        const filteredFieldTypes = allFieldTypes.filter((type: string) => 
          !['nested', 'object'].includes(type)
        );
        setFieldTypes(filteredFieldTypes);
        
        // Extraire les opérations disponibles
        const opsRefs = schemaData?.properties?.fields?.items?.properties?.pipeline?.items?.oneOf || [];
        console.log('Opérations trouvées dans le schéma:', opsRefs);
        
        const ops = opsRefs
          .map((ref: any) => {
            const opName = ref?.$ref?.split('/').pop()?.replace('Op', '');
            console.log('Référence d\'opération:', ref?.$ref, '→ Nom extrait:', opName);
            return opName;
          })
          .filter(Boolean)
          .map((op: string) => op.charAt(0).toLowerCase() + op.slice(1)); // camelCase
        
        console.log('Opérations finales extraites:', ops);
        
        // Validation et fallback des opérations
        if (ops.length === 0) {
          console.warn('Aucune opération trouvée dans le schéma, utilisation des opérations par défaut');
          const defaultOps = ['trim', 'cast', 'map', 'filter', 'sort'];
          setOperations(defaultOps);
        } else {
          setOperations(ops);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schema');
        console.error('Schema loading error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSchema();
  }, []);

  return {
    schema,
    fieldTypes,
    operations,
    version,
    loading,
    error
  };
}

// Hook spécialisé pour les types de champs
export function useFieldTypes(): { fieldTypes: string[]; loading: boolean; error: string | null } {
  const { fieldTypes, loading, error } = useSchema();
  return { fieldTypes, loading, error };
}

// Hook spécialisé pour les opérations
export function useOperations(): { operations: string[]; loading: boolean; error: string | null } {
  const { operations, loading, error } = useSchema();
  return { operations, loading, error };
}

// Hook pour la version du schéma
export function useSchemaVersion(): { version: string; loading: boolean; error: string | null } {
  const { version, loading, error } = useSchema();
  return { version, loading, error };
}

