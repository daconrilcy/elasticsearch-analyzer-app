// src/features/apiClient.ts
// Couche de communication centralisée avec le backend v1.

// import { useAuthStore } from '@/features/store/authStore';
import type { 
    Dataset,
    DatasetDetailOut, 
    FileDetailOut, 
    MappingOut, 
    MappingCreate, 
    UploadResponse,
    IngestionResponse,
    StatusResponse,
    AuthCredentials,
    RegisterCredentials,
    AuthResponse,
    User,
    ProjectListItem,
    FullProject
} from "@/types/api.v1";

// ReactFlowEdge est importé depuis le fichier de types partagés, pas directement de la bibliothèque.
import type { AnalyzerGraph, CustomNode, ReactFlowEdge } from "@/shared/types/analyzer.d.ts";
import { ApiError } from "@/features/errors";

// --- CONFIGURATION CENTRALE ---
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Client fetch "intelligent" qui ajoute l'URL de base et le token d'authentification.
 * Gère de manière centralisée les erreurs et la déconnexion.
 */
export const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    
    // --- CORRECTION : Le code de gestion du token est supprimé ---
    // Le navigateur ajoutera le cookie HttpOnly automatiquement.

    if (options.body && !(options.body instanceof FormData)) {
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl, { 
        ...options, 
        headers,
        // Important pour que le navigateur envoie les cookies vers un autre domaine (ex: localhost:5173 -> localhost:8000)
        credentials: 'include' 
    });
    
    // La gestion des erreurs reste essentielle
    if (!response.ok) {
        if (response.status === 401) {
            throw new ApiError('Session expirée. Veuillez vous reconnecter.', 401);
        }
    
        const rawText = await response.text(); // ✅ on lit une seule fois
        let detail: string;
    
        try {
            const parsed = JSON.parse(rawText);
            detail = typeof parsed.detail === 'string'
                ? parsed.detail
                : `Erreur ${response.status}`;
        } catch {
            detail = `Erreur ${response.status}: ${response.statusText}`;
        }

        throw new ApiError(detail, response.status);
    }   

    return response;
};


// --- Fonctions d'appel API ---

// Auth
export const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await apiClient('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    // Le cookie est maintenant positionné par le serveur, cette fonction peut juste retourner la réponse
    return response.json();
};
export const register = async (credentials: RegisterCredentials): Promise<User> => {
    const response = await apiClient('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
    return response.json();
};
// --- CORRECTION : La fonction n'a plus besoin de recevoir un token ---
export const getCurrentUser = async (): Promise<User> => {
    const response = await apiClient('/api/v1/auth/me');
    return response.json();
};

export const logout = async (): Promise<void> => {
    // Envoie une requête au backend pour lui dire de supprimer le cookie.
    // On ne traite pas l'erreur ici, car même si elle échoue, le frontend doit se déconnecter.
    await apiClient('/api/v1/auth/logout', { method: 'POST' }).catch(console.error);
};

// Datasets
export const getDatasets = async (): Promise<Dataset[]> => {
    const response = await apiClient('/api/v1/datasets/');
    return response.json();
};
export const getDatasetDetails = async (datasetId: string): Promise<DatasetDetailOut> => {
    const response = await apiClient(`/api/v1/datasets/${datasetId}`);
    return response.json();
};
export const createDataset = async (name: string, description: string): Promise<Dataset> => {
    const response = await apiClient('/api/v1/datasets/', { method: 'POST', body: JSON.stringify({ name, description }) });
    return response.json();
};

// Files
export const uploadFile = async (datasetId: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient(`/api/v1/datasets/${datasetId}/files`, { method: 'POST', body: formData });
    return response.json();
};
export const getFileDetails = async (fileId: string): Promise<FileDetailOut> => {
    const response = await apiClient(`/api/v1/files/${fileId}`);
    return response.json();
};
export const deleteFile = async (fileId: string): Promise<void> => {
    await apiClient(`/api/v1/files/${fileId}`, { method: 'DELETE' });
};
export const reparseFile = async (fileId: string): Promise<{ message: string }> => {
    const response = await apiClient(`/api/v1/files/${fileId}/reparse`, { method: 'POST' });
    return response.json();
};

// Mappings & Ingestion
export const createMapping = async (datasetId: string, mappingData: MappingCreate): Promise<MappingOut> => {
    const response = await apiClient(`/api/v1/datasets/${datasetId}/mappings`, { method: 'POST', body: JSON.stringify(mappingData) });
    return response.json();
};

export const startIngestion = async (fileId: string, indexName: string, mapping: any): Promise<IngestionResponse> => {
    const payload = { file_id: fileId, index_name: indexName, mapping };
    const response = await apiClient('/api/v1/datasets/ingest', { method: 'POST', body: JSON.stringify(payload) });
    return response.json();
};

export const getIngestionStatus = async (jobId: string): Promise<StatusResponse> => {
    const response = await apiClient(`/api/v1/datasets/ingest/status/${jobId}`);
    return response.json();
};

// Projects (Analyzer)
export const getAllProjects = async (): Promise<ProjectListItem[]> => {
    const response = await apiClient('/api/v1/projects/');
    return response.json();
};
export const getProjectById = async (projectId: number): Promise<FullProject> => {
    const response = await apiClient(`/api/v1/projects/${projectId}`);
    return response.json();
};
export const saveProject = async (project: { id: number | null; name: string; graph: AnalyzerGraph }): Promise<FullProject> => {
    const isNew = project.id === null;
    const url = isNew ? '/api/v1/projects/' : `/api/v1/projects/${project.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const graphPayload = {
        nodes: project.graph.nodes.map((node: CustomNode) => ({ ...node.data, meta: { position: node.position, type: node.type } })),
        edges: project.graph.edges.map((e: ReactFlowEdge) => ({ id: e.id, source: e.source, target: e.target }))
    };

    const response = await apiClient(url, { method, body: JSON.stringify({ name: project.name, description: "N/A", graph: graphPayload }) });
    return response.json();
};