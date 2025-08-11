import { useFilePreview } from '../hooks/useFilePreview';
import { ChunkNavigation } from './ChunkNavigation';
import { DataGridVirtual } from '../../../components/datagrid/DataGridVirtual';
import styles from './FilePreview.module.scss';

interface FilePreviewProps {
  fileId: string;
}

export function FilePreview({ fileId }: FilePreviewProps) {
  const {
    file,
    currentChunk,
    previewState,
    chunkState,
    actions,
  } = useFilePreview(fileId);

  // Afficher les états de chargement/erreur
  if (previewState.status !== 'ready') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.statusContainer}>
            <h2>Prévisualisation du fichier</h2>
            <div className={styles.statusContent}>
              {previewState.status === 'loading' && (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Chargement du fichier...</p>
                </div>
              )}
              {previewState.status === 'error' && (
                <div className={styles.error}>
                  <h3>Erreur de chargement</h3>
                  <p>{previewState.errorMessage || 'Une erreur est survenue lors du chargement du fichier.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État de chargement si pas de chunk
  if (!currentChunk) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.statusContainer}>
            <h2>Prévisualisation du fichier</h2>
            <div className={styles.loadingState}>
              <p>Chargement de la prévisualisation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le contenu principal
  return (
    <div className={styles.container}>
      {/* Header avec métadonnées du fichier */}
      <div className={styles.header}>
        <div className={styles.fileInfo}>
          <h2>{file?.filename_original || 'Fichier'}</h2>
          <div className={styles.fileMetadata}>
            <span>Type: {file?.mime_type || 'Inconnu'}</span>
            <span>Taille: {file?.size_bytes ? `${(file.size_bytes / 1024 / 1024).toFixed(2)} MB` : 'Inconnue'}</span>
            <span>Statut: {file?.status || 'Inconnu'}</span>
          </div>
        </div>
      </div>

      {/* Navigation entre chunks */}
      <ChunkNavigation
        chunkState={chunkState}
        onChunkSizeChange={actions.changeChunkSize}
        onPreviousChunk={actions.goToPreviousChunk}
        onNextChunk={actions.goToNextChunk}
        onChunkIndexChange={actions.goToChunk}
      />

      {/* Tableau scrollable */}
      <div className={styles.scrollableTable}>
        <DataGridVirtual
          rows={currentChunk.rows}
          height={520}
        />
      </div>

      {/* Affichage des erreurs de chunk */}
      {previewState.errorMessage && (
        <div className={styles.chunkError}>
          <p>{previewState.errorMessage}</p>
        </div>
      )}

      {/* Barre d'outils pour l'export */}
      <div className={styles.toolbar}>
        <button
          onClick={actions.exportCurrentChunk}
          disabled={!currentChunk?.rows.length}
          className={styles.exportButton}
        >
          Exporter en CSV
        </button>
        <span className={styles.chunkInfo}>
          Chunk {chunkState.currentIndex + 1} sur {Math.ceil(chunkState.totalRows / chunkState.chunkSize)}
          ({chunkState.totalRows} lignes total)
        </span>
      </div>
    </div>
  );
}
