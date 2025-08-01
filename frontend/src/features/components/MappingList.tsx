import React from 'react';
import type { MappingOut } from '@/types/api.v1';

interface MappingListProps {
  mappings: MappingOut[];
}

export const MappingList: React.FC<MappingListProps> = ({ mappings }) => {
  if (!mappings.length) {
    return (
      <section>
        <h3>Mappings</h3>
        <p>Aucun mapping n'a été créé pour ce dataset.</p>
      </section>
    );
  }

  return (
    <section>
      <h3>Mappings</h3>
      <ul>
        {mappings.map((mapping) => (
          <li key={mapping.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span>{mapping.name}</span>
            {mapping.index_name && <span style={{ fontStyle: 'italic', color: 'grey' }}>Index: {mapping.index_name}</span>}
            <div style={{ marginLeft: 'auto' }}>
              {/* TODO: Ajouter les boutons pour lancer l'ingestion, modifier ou supprimer le mapping */}
              <button>Lancer l'ingestion</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
