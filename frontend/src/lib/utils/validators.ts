import type { FileOut, FilePreviewChunk } from '../api/types';

export function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         Object.prototype.toString.call(value) === '[object Object]';
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isFileOut(value: any): value is FileOut {
  return isPlainObject(value) &&
         typeof value.filename_original === 'string' &&
         typeof value.status === 'string' &&
         typeof value.id === 'string' &&
         isValidUUID(value.id);
}

export function isFilePreviewChunk(value: any): value is FilePreviewChunk {
  return isPlainObject(value) &&
         Array.isArray(value.rows) &&
         typeof value.chunk_index === 'number' &&
         typeof value.chunk_size === 'number' &&
         typeof value.total_rows === 'number' &&
         typeof value.has_more === 'boolean';
}

