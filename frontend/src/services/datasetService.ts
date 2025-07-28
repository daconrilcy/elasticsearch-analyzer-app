import { apiClient } from './apiClient';

// --- Définition des types pour les réponses de l'API ---

// Nouveau type pour l'objet Dataset
interface Dataset {
    id: string;
    name: string;
    description: string;
}

interface UploadResponse {
  file_id: string;
  filename: string;
  schema: any[]; 
}

interface IngestionResponse {
  job_id: string;
  status: string;
}

interface StatusResponse {
  job_id: string;
  status: 'in_progress' | 'success' | 'error';
  detail?: string;
}

/**
 * Gère les erreurs des réponses API qui ne sont pas 'ok'.
 */
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Une erreur est survenue');
  }
};

/**
 * Service pour gérer la création de datasets, l'upload de fichiers et l'ingestion.
 */
class DatasetService {
  /**
   * Crée un nouveau jeu de données (Dataset).
   * @param name Le nom du jeu de données.
   * @param description La description du jeu de données.
   * @returns Le jeu de données créé, incluant son ID.
   */
  async createDataset(name: string, description: string): Promise<Dataset> {
    const response = await apiClient('/api/v1/datasets/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    await handleApiError(response);
    return response.json();
  }

  /**
   * Envoie un fichier vers un jeu de données existant.
   * @param datasetId L'ID du jeu de données parent.
   * @param file Le fichier à uploader.
   * @returns Les métadonnées du fichier et le schéma détecté.
   */
  async upload(datasetId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient(`/api/v1/datasets/${datasetId}/upload-file/`, {
      method: 'POST',
      body: formData,
    });

    await handleApiError(response);
    return response.json();
  }

  /**
   * Lance le processus de création d'index et d'ingestion des données.
   * @param fileId L'ID du fichier uploadé.
   * @param indexName Le nom de l'index Elasticsearch à créer.
   * @param mapping Le mapping des champs défini par l'utilisateur.
   * @returns L'ID du job d'ingestion pour le suivi.
   */
  async startIngestion(fileId: string, indexName: string, mapping: any): Promise<IngestionResponse> {
    const payload = {
      file_id: fileId,
      index_name: indexName,
      mapping: mapping,
    };

    const response = await apiClient('/datasets/ingest', { // Note: endpoint à vérifier
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await handleApiError(response);
    return response.json();
  }

  /**
   * Récupère le statut d'un job d'ingestion en cours.
   * @param jobId L'ID du job à vérifier.
   * @returns Le statut actuel du job.
   */
  async getIngestionStatus(jobId: string): Promise<StatusResponse> {
    const response = await apiClient(`/datasets/ingest/status/${jobId}`, { // Note: endpoint à vérifier
      method: 'GET',
    });

    await handleApiError(response);
    return response.json();
  }
}

// Exporter une instance singleton du service
export const datasetService = new DatasetService();
