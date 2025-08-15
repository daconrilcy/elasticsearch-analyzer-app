import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import styles from './TargetNode.module.scss';

// Les types de données Elasticsearch que nous supportons
const esTypes = ['keyword', 'text', 'integer', 'float', 'date', 'boolean'];

// Le composant pour notre nœud personnalisé
export const TargetNode = memo(({ data, id }: NodeProps) => {
  const onNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    // La mise à jour du nom sera gérée dans le composant parent
    data.onNameChange(id, evt.target.value);
  };

  const onTypeChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    // La mise à jour du type sera gérée dans le composant parent
    data.onTypeChange(id, evt.target.value);
  };

  return (
    <div className={styles.targetNode}>
      {/* "Handle" est le point de connexion pour les liens */}
      <Handle type="target" position={Position.Left} />
      <div>
        <label>Nom du champ:</label>
        <input
          type="text"
          defaultValue={data.label}
          onChange={onNameChange}
          className={styles.nodrag} // Empêche le drag du nœud quand on interagit avec l'input
        />
        <label>Type ES:</label>
        <select
          defaultValue={data.es_type || 'keyword'}
          onChange={onTypeChange}
          className={styles.nodrag}
        >
          {esTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
});
