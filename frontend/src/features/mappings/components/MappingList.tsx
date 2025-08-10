import React from 'react';
import type { MappingOut } from '@shared/types';
import styles from './MappingList.module.scss';

interface MappingListProps {
  mappings: MappingOut[];
}

export const MappingList: React.FC<MappingListProps> = ({ mappings }) => {
  if (!mappings.length) {
    return (
      <section className={styles['mapping-list']}>
        <div className={styles['mapping-section']}>
          <h3>Mappings</h3>
          <p className={styles['no-mappings']}>Aucun mapping n'a été créé pour ce dataset.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles['mapping-list']}>
      <div className={styles['mapping-section']}>
        <h3>Mappings</h3>
        <ul>
          {mappings.map((mapping) => (
            <li key={mapping.id}>
              <span>{mapping.name}</span>
              {mapping.index_name && <span>Index: {mapping.index_name}</span>}
              <div className={styles['mapping-actions']}>
                {/* TODO: Ajouter les boutons pour lancer l'ingestion, modifier ou supprimer le mapping */}
                <button>Lancer l'ingestion</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
