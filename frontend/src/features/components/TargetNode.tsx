import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

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
    <div style={{ border: '1px solid #555', padding: '10px', borderRadius: '5px', background: '#fff' }}>
      {/* "Handle" est le point de connexion pour les liens */}
      <Handle type="target" position={Position.Left} />
      <div>
        <label style={{ display: 'block', fontSize: '12px' }}>Nom du champ:</label>
        <input
          type="text"
          defaultValue={data.label}
          onChange={onNameChange}
          className="nodrag" // Empêche le drag du nœud quand on interagit avec l'input
        />
        <label style={{ display: 'block', fontSize: '12px', marginTop: '5px' }}>Type ES:</label>
        <select
          defaultValue={data.es_type || 'keyword'}
          onChange={onTypeChange}
          className="nodrag"
        >
          {esTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
});
