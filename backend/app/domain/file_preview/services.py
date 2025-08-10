"""Services de génération d'aperçus (chunked) pour différents types de fichiers."""
from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, Any, List, Optional, Iterable

import pandas as pd

from app.core.config import settings
from app.domain.file import models as file_models
from app.domain.file_preview.schemas import FilePreviewChunk


DEFAULT_CHUNK_SIZE = 100


class FilePreviewService:
    def __init__(self, default_chunk_size: int = DEFAULT_CHUNK_SIZE) -> None:
        self.default_chunk_size = default_chunk_size

    def get_file_path(self, file: file_models.File) -> Path:
        return settings.UPLOAD_DIR / str(file.dataset_id) / file.filename_stored

    def _normalize_rows(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        # Remplacer NaN par None pour sérialisation JSON
        df = df.where(pd.notna(df), None)
        return df.to_dict(orient="records")

    def _build_chunk(self, df: pd.DataFrame, chunk_index: int, chunk_size: int) -> FilePreviewChunk:
        total_rows = len(df)
        total_chunks = max(1, (total_rows + chunk_size - 1) // chunk_size)
        start = chunk_index * chunk_size
        end = min(start + chunk_size, total_rows)
        if start >= total_rows:
            # chunk vide au-delà des données
            rows: List[Dict[str, Any]] = []
        else:
            rows = self._normalize_rows(df.iloc[start:end])

        return FilePreviewChunk(
            chunk_index=chunk_index,
            chunk_size=chunk_size,
            total_rows=total_rows,
            total_chunks=total_chunks,
            rows=rows,
        )

    def preview_csv_like(self, path: Path, chunk_index: int, chunk_size: int) -> FilePreviewChunk:
        # Détecte le séparateur; fallback point-virgule
        try:
            with path.open("r", encoding="utf-8-sig") as csvfile:
                try:
                    dialect = csv.Sniffer().sniff(csvfile.read(2048))
                    csvfile.seek(0)
                    df = pd.read_csv(csvfile, sep=dialect.delimiter)
                except (csv.Error, pd.errors.ParserError):
                    csvfile.seek(0)
                    df = pd.read_csv(csvfile, sep=";")
        except UnicodeDecodeError:
            # Fallback lecture directe via pandas (laisser pandas deviner)
            df = pd.read_csv(path)
        return self._build_chunk(df, chunk_index, chunk_size)

    def preview_excel(self, path: Path, chunk_index: int, chunk_size: int) -> FilePreviewChunk:
        df = pd.read_excel(path)
        return self._build_chunk(df, chunk_index, chunk_size)

    def preview_json(self, path: Path, chunk_index: int, chunk_size: int) -> FilePreviewChunk:
        # Support JSONL si possible; sinon JSON tableau
        try:
            df = pd.read_json(path, lines=True)
        except ValueError:
            df = pd.read_json(path)
        return self._build_chunk(df, chunk_index, chunk_size)

    def get_preview(self, file: file_models.File, chunk_index: int = 0, chunk_size: Optional[int] = None) -> FilePreviewChunk:
        path = self.get_file_path(file)
        size = chunk_size or self.default_chunk_size
        suffix = path.suffix.lower()

        if suffix == ".csv":
            return self.preview_csv_like(path, chunk_index, size)
        if suffix in (".xlsx", ".xls"):
            return self.preview_excel(path, chunk_index, size)
        if suffix == ".json":
            return self.preview_json(path, chunk_index, size)

        # Par défaut, tentative via pandas (peut couvrir tsv, etc.)
        try:
            df = pd.read_csv(path)
        except Exception:
            df = pd.read_json(path)
        return self._build_chunk(df, chunk_index, size)





