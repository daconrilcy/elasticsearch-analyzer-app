import { httpJson, createEventSource } from './client';
import type { UUID, FileOut, FilePreviewChunk, FileStatusUpdate } from './types';

export async function getFile(fileId: UUID): Promise<FileOut | null> {
  return httpJson<FileOut>(`/files/${fileId}`);
}

export async function getFilePreview(
  fileId: UUID, 
  chunkIndex: number = 0, 
  chunkSize: number = 100
): Promise<FilePreviewChunk | null> {
  const params = new URLSearchParams({
    chunk_index: chunkIndex.toString(),
    chunk_size: chunkSize.toString(),
  });
  
  return httpJson<FilePreviewChunk>(`/files/${fileId}/preview?${params}`);
}

export function openFileStatusSSE(
  fileId: UUID, 
  onEvent: (event: FileStatusUpdate) => void
): EventSource {
  const eventSource = createEventSource(`/files/${fileId}/status`);
  
  eventSource.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data) as FileStatusUpdate;
      onEvent(data);
    } catch (error) {
      console.error('Erreur de parsing SSE:', error);
    }
  });

  eventSource.addEventListener('error', (error) => {
    console.error('Erreur SSE:', error);
  });

  return eventSource;
}

