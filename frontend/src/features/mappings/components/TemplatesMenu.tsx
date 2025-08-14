import React, { useState } from 'react';
import styles from './TemplatesMenu.module.scss';

interface DSLTemplate {
  id: string;
  name: string;
  description: string;
  dsl: any;
}

const templates: DSLTemplate[] = [
  {
    id: 'contacts',
    name: 'Contacts',
    description: 'Gestion des contacts avec validation des emails et téléphones',
    dsl: {
      version: '2.2',
      fields: [
        {
          name: 'id',
          type: 'keyword',
          pipeline: [
            {
              op: 'trim',
              config: {}
            }
          ]
        },
        {
          name: 'email',
          type: 'keyword',
          pipeline: [
            {
              op: 'trim',
              config: {}
            },
            {
              op: 'cast',
              config: { to: 'lowercase' }
            }
          ]
        },
        {
          name: 'phone',
          type: 'keyword',
          pipeline: [
            {
              op: 'trim',
              config: {}
            },
            {
              op: 'map',
              config: { 
                pattern: '\\d+',
                replace: ''
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'addresses',
    name: 'Adresses',
    description: 'Gestion des adresses avec géocodage et validation',
    dsl: {
      version: '2.2',
      fields: [
        {
          name: 'street',
          type: 'text',
          pipeline: [
            {
              op: 'trim',
              config: {}
            },
            {
              op: 'cast',
              config: { to: 'titlecase' }
            }
          ]
        },
        {
          name: 'city',
          type: 'keyword',
          pipeline: [
            {
              op: 'trim',
              config: {}
            },
            {
              op: 'cast',
              config: { to: 'titlecase' }
            }
          ]
        },
        {
          name: 'postal_code',
          type: 'keyword',
          pipeline: [
            {
              op: 'trim',
              config: {}
            }
          ]
        }
      ]
    }
  },
  {
    id: 'logs',
    name: 'Logs',
    description: 'Gestion des logs avec parsing et indexation temporelle',
    dsl: {
      version: '2.2',
      fields: [
        {
          name: 'timestamp',
          type: 'date',
          pipeline: [
            {
              op: 'cast',
              config: { 
                format: 'ISO8601',
                timezone: 'UTC'
              }
            }
          ]
        },
        {
          name: 'level',
          type: 'keyword',
          pipeline: [
            {
              op: 'trim',
              config: {}
            },
            {
              op: 'cast',
              config: { to: 'uppercase' }
            }
          ]
        },
        {
          name: 'message',
          type: 'text',
          pipeline: [
            {
              op: 'trim',
              config: {}
            }
          ]
        }
      ]
    }
  }
];

interface TemplatesMenuProps {
  onApply: (template: DSLTemplate) => void;
  className?: string;
}

export const TemplatesMenu: React.FC<TemplatesMenuProps> = ({
  onApply,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTemplateClick = (template: DSLTemplate) => {
    onApply(template);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Ouvrir le menu des templates"
      >
        📋 Templates DSL
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h4>Templates disponibles</h4>
            <span>Cliquez pour appliquer</span>
          </div>
          
          <div className={styles.templates}>
            {templates.map((template) => (
              <button
                key={template.id}
                className={styles.template}
                onClick={() => handleTemplateClick(template)}
                aria-label={`Appliquer le template ${template.name}`}
              >
                <div className={styles.templateHeader}>
                  <h5>{template.name}</h5>
                  <span className={styles.version}>v2.2</span>
                </div>
                <p>{template.description}</p>
                <div className={styles.fields}>
                  {template.dsl.fields.length} champs
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesMenu;
