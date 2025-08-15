import { useState } from 'react';
import { useFieldTypes, useOperations } from '../../hooks';
import { SortableItem } from '../SortableItem';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import styles from './FieldsGrid.module.scss';

type InputSource =
  | { kind: 'column'; name: string }
  | { kind: 'literal'; value: unknown }
  | { kind: 'jsonpath'; expr: string };

type Operation = { op: string } & Record<string, unknown>;

export interface Field {
  id: string;
  target: string;
  type: string;
  input: InputSource[];
  pipeline: Operation[];
  copy_to?: string[];
  ignore_above?: number;
  null_value?: any;
}

interface FieldsGridProps {
  fields: Field[];
  onAddField: () => void;
  onRemoveField: (id: string) => void;
  onFieldChange: (id: string, field: Partial<Field>) => void;
  onFieldsReorder?: (newFields: Field[]) => void; // Nouvelle prop pour le réordonnancement
}

export function FieldsGrid({
  fields,
  onAddField,
  onRemoveField,
  onFieldChange,
  onFieldsReorder
}: FieldsGridProps) {
  const { fieldTypes, loading: typesLoading, error: typesError } = useFieldTypes();
  const { operations, loading: opsLoading, error: opsError } = useOperations();

  const [expandedField, setExpandedField] = useState<string | null>(null);

  const handleFieldChange = (id: string, changes: Partial<Field>) => {
    onFieldChange(id, changes);
  };

  const addOperation = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newOperation = { op: operations[0] || 'trim' };
      const updatedField = {
        ...field,
        pipeline: [...field.pipeline, newOperation]
      };
      onFieldChange(fieldId, updatedField);
    }
  };

  const removeOperation = (fieldId: string, opIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const updatedPipeline = field.pipeline.filter((_, index) => index !== opIndex);
      onFieldChange(fieldId, { pipeline: updatedPipeline });
    }
  };

  const updateOperation = (fieldId: string, opIndex: number, changes: any) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const updatedPipeline = [...field.pipeline];
      updatedPipeline[opIndex] = { ...updatedPipeline[opIndex], ...changes };
      onFieldChange(fieldId, { pipeline: updatedPipeline });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && onFieldsReorder) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fields, oldIndex, newIndex);
        onFieldsReorder(newFields);
      }
    }
  };

  if (typesLoading || opsLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement du schéma...</p>
        <p>Types de champs: {typesLoading ? 'Chargement...' : fieldTypes.length}</p>
        <p>Opérations: {opsLoading ? 'Chargement...' : operations.length}</p>
      </div>
    );
  }

  if (typesError || opsError) {
    return (
      <div className={styles.error}>
        <p>Erreur lors du chargement du schéma:</p>
        <p>{typesError || opsError}</p>
        <p>Types de champs disponibles: {fieldTypes.length}</p>
        <p>Opérations disponibles: {operations.length}</p>
      </div>
    );
  }

  return (
    <div className={styles.fieldsGrid}>
      <div className={styles.header}>
        <h3>Champs du Mapping</h3>
        <div className={styles.headerInfo}>
          <span className={styles.fieldsCount}>{fields.length} champ{fields.length !== 1 ? 's' : ''}</span>
          <button 
            type="button" 
            onClick={onAddField}
            className={styles.addButton}
          >
            + Ajouter un champ
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aucun champ défini. Ajoutez votre premier champ pour commencer.</p>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.fieldsList}>
              {fields.map((field, index) => (
                <SortableItem key={field.id} id={field.id} className={styles.sortableFieldItem}>
                  <div className={styles.fieldItem}>
                    <div className={styles.fieldHeader}>
                      <div className={styles.fieldOrder}>
                        <span className={styles.orderNumber}>{index + 1}</span>
                      </div>
                      <div className={styles.fieldBasic}>
                        <input
                          type="text"
                          placeholder="Nom du champ"
                          value={field.target}
                          onChange={(e) => handleFieldChange(field.id, { target: e.target.value })}
                          className={styles.fieldName}
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(field.id, { type: e.target.value })}
                          className={styles.fieldType}
                        >
                          <option value="">Sélectionner un type</option>
                          {fieldTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.fieldActions}>
                        <button
                          type="button"
                          onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                          className={styles.expandButton}
                        >
                          {expandedField === field.id ? '−' : '+'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveField(field.id)}
                          className={styles.removeButton}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {expandedField === field.id && (
                      <div className={styles.fieldDetails}>
                        <div className={styles.section}>
                          <h4>Sources d'entrée</h4>
                          <div className={styles.inputsList}>
                            {field.input.map((input, index) => (
                              <div key={index} className={styles.inputItem}>
                                <select
                                  value={input.kind}
                                  onChange={(e) => {
                                    const kind = e.target.value as InputSource['kind'];
                                    const newInput: InputSource =
                                      kind === 'column'
                                        ? { kind: 'column', name: '' }
                                        : kind === 'literal'
                                          ? { kind: 'literal', value: '' }
                                          : { kind: 'jsonpath', expr: '' };

                                    const newInputs = [...field.input];
                                    newInputs[index] = newInput;
                                    handleFieldChange(field.id, { input: newInputs });
                                  }}
                                  className={styles.inputKind}
                                >
                                  <option value="column">Colonne</option>
                                  <option value="literal">Littéral</option>
                                  <option value="jsonpath">JSONPath</option>
                                </select>
                                
                                {input.kind === 'column' && (
                                  <input
                                    type="text"
                                    placeholder="Nom de la colonne"
                                    value={input.name || ''}
                                    onChange={(e) => {
                                      const newInputs = [...field.input];
                                      newInputs[index] = { ...input, name: e.target.value };
                                      handleFieldChange(field.id, { input: newInputs });
                                    }}
                                    className={styles.inputValue}
                                  />
                                )}
                                
                                {input.kind === 'literal' && (
                                  <input
                                    type="text"
                                    placeholder="Valeur littérale"
                                    value={String(input.value || '')}
                                    onChange={(e) => {
                                      const newInputs = [...field.input];
                                      newInputs[index] = { ...input, value: e.target.value };
                                      handleFieldChange(field.id, { input: newInputs });
                                    }}
                                    className={styles.inputValue}
                                  />
                                )}
                                
                                {input.kind === 'jsonpath' && (
                                  <input
                                    type="text"
                                    placeholder="Expression JSONPath"
                                    value={input.expr || ''}
                                    onChange={(e) => {
                                      const newInputs = [...field.input];
                                      newInputs[index] = { ...input, expr: e.target.value };
                                      handleFieldChange(field.id, { input: newInputs });
                                    }}
                                    className={styles.inputValue}
                                  />
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newInputs = field.input.filter((_, i) => i !== index);
                                    handleFieldChange(field.id, { input: newInputs });
                                  }}
                                  className={styles.removeInput}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newInputs = [
                                  ...field.input,
                                  { kind: 'column', name: '' } satisfies InputSource
                                ];
                                handleFieldChange(field.id, { input: newInputs });
                              }}
                              className={styles.addInput}
                            >
                              + Ajouter une colonne
                            </button>
                          </div>
                        </div>

                        <div className={styles.section}>
                          <h4>Pipeline de transformation</h4>
                          <div className={styles.pipelineInfo}>
                            <small>Opérations disponibles: {operations.length} ({operations.join(', ')})</small>
                          </div>
                          <div className={styles.pipelineList}>
                            {field.pipeline.map((operation, index) => (
                              <div key={index} className={styles.operationItem}>
                                <select
                                  value={operation.op}
                                  onChange={(e) => updateOperation(field.id, index, { op: e.target.value })}
                                  className={styles.operationSelect}
                                >
                                  <option value="">Sélectionner une opération</option>
                                  {operations.map((op) => (
                                    <option key={op} value={op}>
                                      {op}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeOperation(field.id, index)}
                                  className={styles.removeOperation}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOperation(field.id)}
                              className={styles.addOperation}
                              disabled={operations.length === 0}
                            >
                              + Ajouter une opération {operations.length === 0 && '(Aucune disponible)'}
                            </button>
                          </div>
                        </div>

                        <div className={styles.section}>
                          <h4>Options Elasticsearch</h4>
                          <div className={styles.optionsList}>
                            <div className={styles.optionGroup}>
                              <label>
                                Copy to:
                                <div className={styles.copyToList}>
                                  {(field.copy_to || []).map((copyTo, index) => (
                                    <div key={index} className={styles.copyToItem}>
                                      <input
                                        type="text"
                                        placeholder="Nom du champ de copie"
                                        value={copyTo}
                                        onChange={(e) => {
                                          const newCopyTo = [...(field.copy_to || [])];
                                          newCopyTo[index] = e.target.value;
                                          handleFieldChange(field.id, { copy_to: newCopyTo });
                                        }}
                                        className={styles.copyToInput}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newCopyTo = (field.copy_to || []).filter((_, i) => i !== index);
                                          handleFieldChange(field.id, { copy_to: newCopyTo });
                                        }}
                                        className={styles.removeCopyTo}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCopyTo = [...(field.copy_to || []), ''];
                                      handleFieldChange(field.id, { copy_to: newCopyTo });
                                    }}
                                    className={styles.addCopyTo}
                                  >
                                    + Ajouter un champ de copie
                                  </button>
                                </div>
                              </label>
                            </div>

                            {field.type === 'text' && (
                              <div className={styles.optionGroup}>
                                <label>
                                  Ignore above:
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Limite de caractères"
                                    value={field.ignore_above || ''}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                                      handleFieldChange(field.id, { ignore_above: value });
                                    }}
                                  />
                                </label>
                              </div>
                            )}

                            {field.type !== 'text' && (
                              <div className={styles.optionGroup}>
                                <label>
                                  Null value:
                                  <input
                                    type="text"
                                    placeholder="Valeur par défaut"
                                    value={field.null_value || ''}
                                    onChange={(e) => {
                                      const value = e.target.value || undefined;
                                      handleFieldChange(field.id, { null_value: value });
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
