import { apiClient } from './apiClient';

// Définissons les types pour les réponses de l'API pour plus de robustesse
interface UploadResponse {
  file_id: string;
  filename: string;
  schema: any[]; // Idéalement, typer le schéma plus précisément
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
 * @param response La réponse de l'API.
 */
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Une erreur est survenue');
  }
};

/**
 * Service pour gérer l'upload, le mapping et l'ingestion des datasets.
 */
class DatasetService {
  /**
   * Envoie un fichier au backend pour analyse et détection de schéma.
   * @param file Le fichier à uploader.
   * @returns Les métadonnées du fichier et le schéma détecté.
   */
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Note: Pour FormData, le header 'Content-Type' est géré automatiquement par le navigateur.
    // Notre apiClient existant n'a pas besoin d'être modifié.
    const response = await apiClient('/datasets/upload', {
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

    const response = await apiClient('/datasets/ingest', {
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
    const response = await apiClient(`/datasets/ingest/status/${jobId}`, {
      method: 'GET',
    });

    await handleApiError(response);
    return response.json();
  }
}

// Exporter une instance singleton du service
export const datasetService = new DatasetService();
