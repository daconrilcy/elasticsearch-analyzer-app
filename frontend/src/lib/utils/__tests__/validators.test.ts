import { describe, it, expect } from 'vitest';
import { isPlainObject, isValidUUID, isFileOut, isFilePreviewChunk } from '../validators';
import type { FileOut, FilePreviewChunk } from '../../api/types';

describe('validators', () => {
  describe('isPlainObject', () => {
    it('devrait retourner true pour un objet simple', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1, b: 'test' })).toBe(true);
    });

    it('devrait retourner false pour null', () => {
      expect(isPlainObject(null)).toBe(false);
    });

    it('devrait retourner false pour un tableau', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);
    });

    it('devrait retourner false pour des types primitifs', () => {
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('devrait valider des UUIDs valides', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8')).toBe(true);
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('devrait rejeter des UUIDs invalides', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false);
    });
  });

  describe('isFileOut', () => {
    it('devrait valider un FileOut valide', () => {
      const validFile: FileOut = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        filename_original: 'test.csv',
        status: 'ready',
        ingestion_status: 'completed',
        size_bytes: 1024,
        mime_type: 'text/csv',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      expect(isFileOut(validFile)).toBe(true);
    });

    it('devrait rejeter un FileOut invalide', () => {
      expect(isFileOut(null)).toBe(false);
      expect(isFileOut({})).toBe(false);
      expect(isFileOut({ id: 'invalid-uuid', filename_original: 'test.csv' })).toBe(false);
      expect(isFileOut({ id: '123e4567-e89b-12d3-a456-426614174000' })).toBe(false);
    });
  });

  describe('isFilePreviewChunk', () => {
    it('devrait valider un FilePreviewChunk valide', () => {
      const validChunk: FilePreviewChunk = {
        chunk_index: 0,
        chunk_size: 100,
        total_rows: 500,
        rows: [{ col1: 'value1', col2: 'value2' }],
        has_more: true,
      };
      expect(isFilePreviewChunk(validChunk)).toBe(true);
    });

    it('devrait rejeter un FilePreviewChunk invalide', () => {
      expect(isFilePreviewChunk(null)).toBe(false);
      expect(isFilePreviewChunk({})).toBe(false);
      expect(isFilePreviewChunk({ chunk_index: 0, chunk_size: 100 })).toBe(false);
      expect(isFilePreviewChunk({ rows: [], chunk_index: '0', chunk_size: 100, total_rows: 500, has_more: true })).toBe(false);
    });
  });
});
