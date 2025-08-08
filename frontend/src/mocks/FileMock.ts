import { FileStatus, type FileDetail } from '../types/api.v1';

export const mockFiles: FileDetail[] = [
  {
    id: '1',
    filename_original: 'ventes_trimestre_1.csv',
    status: FileStatus.READY,
    version: 2,
    created_at: '2025-07-30T10:00:00Z',
    updated_at: '2025-07-30T10:05:00Z',
    uploader_name: 'alice.dupont',
    size_bytes: 124000,
    line_count: 1500,
    column_count: 12,
    preview_data: [
      { "ID Client": "C001", "Produit": "Widget A", "Montant": 120.50 },
      { "ID Client": "C002", "Produit": "Widget B", "Montant": 89.99 },
    ],
    mapping_id: 'map-001',
    ingestion_status: 'completed',
    hash: 'cdkcskcd;slkcdl;ckdsl;ckds;lckd'
  },
  {
    id: '2',
    filename_original: 'inventaire_stock.xlsx',
    status: FileStatus.PARSING,
    version: 1,
    created_at: '2025-07-31T11:30:00Z',
    updated_at: '2025-07-31T11:31:00Z',
    uploader_name: 'bob.martin',
    size_bytes: 875000,
    line_count: 0, // Inconnu pendant le parsing
    column_count: 0,
    preview_data: [],
    ingestion_status: 'not_started',
    hash: 'sdokcdsockdsocdcpckds'
  },
  {
    id: '3',
    filename_original: 'clients_export_corrompu.csv',
    status: FileStatus.ERROR,
    version: 1,
    created_at: '2025-07-31T14:00:00Z',
    updated_at: '2025-07-31T14:01:00Z',
    uploader_name: 'alice.dupont',
    size_bytes: 56000,
    parsing_error: "Erreur à la ligne 54 : nombre de colonnes incorrect.",
    line_count: 0,
    column_count: 0,
    preview_data: [],
    ingestion_status: 'not_started',
    hash: 'ecwpciewpicewopicepowcipoce'
  },
];