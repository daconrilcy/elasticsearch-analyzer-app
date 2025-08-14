// API client centralisé avec gestion de sécurité
const MODE = import.meta.env?.MODE;
const RAW_BASE = import.meta.env?.VITE_API_BASE as string | undefined;

// En développement, utiliser localhost:8000 par défaut si VITE_API_BASE n'est pas défini
const API_BASE = RAW_BASE ?? (MODE === 'development' ? 'http://localhost:8000' : undefined);

// Validation de sécurité - fail-fast en production, plus permissif en développement
if (!API_BASE) {
  if (MODE === 'production') {
    throw new Error("VITE_API_BASE est requis pour l'API en production. Impossible de continuer.");
  } else {
    console.warn("VITE_API_BASE non défini, utilisation de http://localhost:8000 par défaut");
  }
}

// Fallback pour le développement
const FINAL_API_BASE = API_BASE || 'http://localhost:8000';

// Stockage du token uniquement en mémoire
let authToken: string | null = null;

export const api = {
  // Gestion du token
  setToken: (token: string | null) => {
    authToken = token;
  },

  // 🔧 Toujours renvoyer un objet indexable
  headers: (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  },

  // Méthodes HTTP avec gestion d'erreurs
  async getJson<T = any>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${FINAL_API_BASE}${path}`, {
      method: 'GET',
      headers: this.headers(),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async postJson<T = any>(path: string, body: any, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${FINAL_API_BASE}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Méthodes spécialisées pour les mappings
  async getSchema(etag?: string, signal?: AbortSignal) {
    // 🔧 Ici, c'est un Record<string,string>, donc indexable sans erreur TS
    const headers = this.headers();
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const response = await fetch(`${FINAL_API_BASE}/api/v1/mappings/schema`, {
      method: 'GET',
      headers,
      signal,
    });

    return {
      status: response.status,
      data: response.status === 200 ? await response.json() : null,
      etag: response.headers.get('ETag'),
    };
  },

  async validateMapping(mapping: any, signal?: AbortSignal) {
    return this.postJson('/api/v1/mappings/validate', mapping, signal);
  },

  async dryRunMapping(mapping: any, signal?: AbortSignal) {
    return this.postJson('/api/v1/mappings/dry-run', mapping, signal);
  },

  async compileMapping(mapping: any, includePlan = true, signal?: AbortSignal) {
    return this.postJson(`/api/v1/mappings/compile?includePlan=${includePlan}`, mapping, signal);
  },

  async applyMapping(mapping: any, signal?: AbortSignal) {
    return this.postJson('/api/v1/mappings/apply', mapping, signal);
  },

  async checkIds(mapping: any, signal?: AbortSignal) {
    return this.postJson('/api/v1/mappings/check-ids', mapping, signal);
  },

  async inferTypes(mapping: any, signal?: AbortSignal) {
    return this.postJson('/api/v1/mappings/infer-types', mapping, signal);
  },

  async estimateSize(mapping: any, signal?: AbortSignal) {
    return this.postJson('/api/v1/mappings/estimate-size', mapping, signal);
  },
};

export { FINAL_API_BASE };
export default api;
