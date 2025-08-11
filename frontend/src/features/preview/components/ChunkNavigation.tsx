import React from 'react';
import type { ChunkNavigationState } from '../types';
import styles from './ChunkNavigation.module.scss';

interface ChunkNavigationProps {
  chunkState: ChunkNavigationState;
  onChunkSizeChange: (size: number) => void;
  onPreviousChunk: () => void;
  onNextChunk: () => void;
  onChunkIndexChange: (index: number) => void;
}

export function ChunkNavigation({
  chunkState,
  onChunkSizeChange,
  onPreviousChunk,
  onNextChunk,
  onChunkIndexChange,
}: ChunkNavigationProps) {
  const totalChunks = Math.ceil(chunkState.totalRows / chunkState.chunkSize);

  const handleChunkIndexInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      onChunkIndexChange(value);
    }
  };

  return (
    <div className={styles.chunkControls}>
      <label>
        Taille du chunk:
        <select 
          value={chunkState.chunkSize} 
          onChange={(e) => onChunkSizeChange(parseInt(e.target.value))}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
        </select>
      </label>
      
      <button 
        onClick={onPreviousChunk}
        disabled={chunkState.currentIndex === 0}
        className={styles.navButton}
      >
        Précédent
      </button>
      
      <input
        type="number"
        value={chunkState.currentIndex}
        onChange={handleChunkIndexInput}
        min={0}
        className={styles.chunkIndexInput}
      />
      
      <button
        onClick={onNextChunk}
        disabled={chunkState.currentIndex + 1 >= totalChunks}
        className={styles.navButton}
      >
        Suivant
      </button>
      
      <span className={styles.chunkInfo}>
        Chunk {chunkState.currentIndex + 1} sur {totalChunks}
        ({chunkState.totalRows} lignes total)
      </span>
    </div>
  );
}
