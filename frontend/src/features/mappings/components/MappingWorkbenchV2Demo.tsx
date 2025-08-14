import React, { useState } from 'react';
import { MappingWorkbenchV2 } from './MappingWorkbenchV2';
import styles from './MappingWorkbenchV2Demo.module.scss';

export const MappingWorkbenchV2Demo: React.FC = () => {
  const [mapping, setMapping] = useState({
    name: 'contacts_mapping',
    version: '2.2',
    fields: [
      {
        name: 'full_name',
        type: 'text',
        pipeline: [
          { id: 'op1', type: 'trim', config: {} },
          { id: 'op2', type: 'cast', config: { target_type: 'keyword' } }
        ]
      },
      {
        name: 'email',
        type: 'keyword',
        pipeline: [
          { id: 'op3', type: 'map', config: { transform: 'lowercase' } }
        ]
      },
      {
        name: 'age',
        type: 'integer',
        pipeline: []
      }
    ]
  });

  const [sampleData] = useState([
    { full_name: 'John Doe', email: 'john@example.com', age: 30 },
    { full_name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { full_name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
  ]);

  const handleMappingUpdate = (newMapping: any) => {
    setMapping(newMapping);
    console.log('Mapping mis à jour:', newMapping);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎯 Mapping Studio V2.2 - Démonstration</h1>
        <p>
          Interface complète intégrant tous les composants V2.2 avec anti-drift, 
          performance optimisée et UX moderne
        </p>
      </div>

      <div className={styles.workbenchContainer}>
        <MappingWorkbenchV2
          mapping={mapping}
          sampleData={sampleData}
          onMappingUpdate={handleMappingUpdate}
        />
      </div>

      <div className={styles.info}>
        <h3>✨ Fonctionnalités V2.2 intégrées :</h3>
        <ul>
          <li>🎨 <strong>SchemaBanner</strong> - Statut du schéma avec gestion offline/updated</li>
          <li>📋 <strong>TemplatesMenu</strong> - Templates DSL prêts à l'emploi</li>
          <li>⌨️ <strong>ShortcutsHelp</strong> - Raccourcis clavier et aide contextuelle</li>
          <li>🔧 <strong>PipelineDnD</strong> - Drag & drop des opérations</li>
          <li>📊 <strong>DiffView</strong> - Comparaison des versions de mapping</li>
          <li>🚀 <strong>Performance</strong> - Debounce, rate limiting, abortable requests</li>
          <li>📱 <strong>Responsive</strong> - Interface adaptée à tous les écrans</li>
        </ul>
      </div>
    </div>
  );
};

export default MappingWorkbenchV2Demo;
