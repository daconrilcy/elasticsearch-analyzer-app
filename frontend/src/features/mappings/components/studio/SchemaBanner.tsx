import React from 'react';
import { useSchema } from '../../hooks/useSchema';
import styles from './SchemaBanner.module.scss';

export const SchemaBanner: React.FC = () => {
  const { offline, updated, reload, loading } = useSchema();

  if (!offline && !updated) {
    return null;
  }

  const handleReload = () => {
    reload(true);
  };

  return (
    <div className={`${styles.banner} ${offline ? styles.offline : styles.updated}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          {offline ? '📡' : '🔄'}
        </div>
        <div className={styles.message}>
          {offline ? (
            <>
              <strong>Mode hors ligne</strong>
              <span>Le schéma a été chargé depuis le cache local</span>
            </>
          ) : (
            <>
              <strong>Schéma mis à jour</strong>
              <span>Une nouvelle version du schéma est disponible</span>
            </>
          )}
        </div>
        <button
          onClick={handleReload}
          disabled={loading}
          className={styles.reloadButton}
          aria-label="Recharger le schéma"
        >
          {loading ? 'Chargement...' : 'Recharger'}
        </button>
      </div>
    </div>
  );
};

export default SchemaBanner;
