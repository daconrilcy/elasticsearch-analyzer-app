import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { QueryClient } from "@tanstack/react-query";

import type { FileOut, DatasetDetailOut} from "@/types/api.v1";
import { FileStatus } from "@/types/api.v1";
import { API_BASE_URL } from "@/features/apiClient";

interface UseSSEFileStatusProps {
  processingFiles: FileOut[];
  datasetId: string;
  queryClient: QueryClient;
}

export function useSSEFileStatus({ processingFiles, datasetId, queryClient }: UseSSEFileStatusProps) {
  useEffect(() => {
    const sources: EventSource[] = [];

    processingFiles.forEach((file) => {
      const sseUrl = `${API_BASE_URL}/api/v1/files/${file.id}/status`;
      const eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.addEventListener("status_update", () => {
        queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] }).then(() => {
          const updatedDataset = queryClient.getQueryData<DatasetDetailOut>(["dataset", datasetId]);
          const updatedFile = updatedDataset?.files.find((f) => f.id === file.id);
          if (updatedFile?.status === FileStatus.READY || updatedFile?.status === FileStatus.ERROR) {
            eventSource.close();
          }
        });
      });

      eventSource.addEventListener("parsing_error", (e: MessageEvent) => {
        toast.error(`Erreur de parsing : ${e.data}`);
        eventSource.close();
      });

      eventSource.onerror = (e) => {
        // Si readyState = 2, la connexion est fermée normalement (closed)
        // Pas la peine d'afficher une erreur dans ce cas !
        if (eventSource.readyState === 2) {
            // Optionnel : console.info('SSE fermé proprement');
            eventSource.close();
            return;
        }
        // Sinon, vraie erreur de connexion
        console.error(`Erreur de connexion SSE pour le fichier ${file.filename_original}`);
        console.log(e);
        eventSource.close();
    };

      sources.push(eventSource);
    });

    return () => {
      sources.forEach((es) => es.close());
    };
  }, [processingFiles, queryClient, datasetId]);
}
