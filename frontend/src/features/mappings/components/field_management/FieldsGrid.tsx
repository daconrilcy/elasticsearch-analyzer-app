import { useState } from 'react';
import { useFieldTypes, useOperations } from '../../hooks';
import { SortableItem } from './SortableItem';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
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
  null_value?: unknown;
}

interface FieldsGridProps {
  fields: Field[];
  onAddField: () => void;
  onRemoveField: (id: string) => void;
  onFieldChange: (id: string, field: Partial<Field>) => void;
  onFieldsReorder?: (newFields: Field[]) => void;
}

export function FieldsGrid({ 
  fields, 
  onAddField, 
  onRemoveField, 
  onFieldChange,
  onFieldsReorder 
}: FieldsGridProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const { fieldTypes, loading: isLoadingTypes, error: typesError } = useFieldTypes();
  const { operations, loading: isLoadingOperations, error: opsError } = useOperations();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), // évite les drags "involontaires"
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onFieldsReorder) return;
    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onFieldsReorder(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleFieldChange = (id: string, changes: Partial<Field>) => {
    onFieldChange(id, changes);
  };

  const addOperation = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newOperation: Operation = { op: operations[0] || 'trim' };
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

  const updateOperation = (fieldId: string, opIndex: number, changes: Partial<Operation>) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const updatedPipeline = [...field.pipeline];
      updatedPipeline[opIndex] = { ...updatedPipeline[opIndex], ...changes };
      onFieldChange(fieldId, { pipeline: updatedPipeline });
    }
  };

  if (isLoadingTypes || isLoadingOperations) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement du schéma...</p>
        <p>Types de champs: {isLoadingTypes ? 'Chargement...' : fieldTypes.length}</p>
        <p>Opérations: {isLoadingOperations ? 'Chargement...' : operations.length}</p>
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
        <h3>Champs de Mapping</h3>
        <div className={styles.headerInfo}>
          <span className={styles.fieldsCount}>{fields.length} champ{fields.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          type="button"
          onClick={onAddField}
          className={styles.addButton}
          disabled={isLoadingTypes}
        >
          + Ajouter un champ
        </button>
      </div>

      {fields.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aucun champ défini</p>
          <p>Commencez par ajouter votre premier champ de mapping</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.fieldsList}>
              {fields.map((field, index) => (
                <SortableItem key={field.id} id={field.id} className={styles.fieldItem}>
                  {({ attributes, listeners, setActivatorNodeRef }) => (
                    <>
                      <div className={styles.fieldHeader}>
                        {/* HANDLE DE DRAG — dédié au drag, pas le reste */}
                        <button
                          type="button"
                          ref={setActivatorNodeRef}
                          {...attributes}
                          {...listeners}
                          className={styles.dragHandle}
                          aria-label="Réorganiser"
                          title="Glisse pour réordonner"
                        >
                          ⋮⋮
                        </button>

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
                              <option key={type} value={type}>{type}</option>
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
                          {/* Section Inputs */}
                          <div className={styles.section}>
                            <h4>Sources d'entrée</h4>
                            <div className={styles.inputsList}>
                              {field.input.map((input, inputIndex) => (
                                <div key={inputIndex} className={styles.inputItem}>
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
                                      newInputs[inputIndex] = newInput;
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
                                        newInputs[inputIndex] = { ...input, name: e.target.value };
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
                                        newInputs[inputIndex] = { ...input, value: e.target.value };
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
                                        newInputs[inputIndex] = { ...input, expr: e.target.value };
                                        handleFieldChange(field.id, { input: newInputs });
                                      }}
                                      className={styles.inputValue}
                                    />
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newInputs = field.input.filter((_, i) => i !== inputIndex);
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

                          {/* Section Pipeline */}
                          <div className={styles.section}>
                            <h4>Pipeline de transformation</h4>
                            <div className={styles.pipelineInfo}>
                              <small>Opérations disponibles: {operations.length} ({operations.join(', ')})</small>
                            </div>
                            <div className={styles.pipelineList}>
                              {field.pipeline.map((operation, opIndex) => (
                                <div key={opIndex} className={styles.operationItem}>
                                  <select
                                    value={operation.op}
                                    onChange={(e) => updateOperation(field.id, opIndex, { op: e.target.value })}
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
                                    onClick={() => removeOperation(field.id, opIndex)}
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

                          {/* Section Options */}
                          <div className={styles.section}>
                            <h4>Options Elasticsearch</h4>
                            <div className={styles.optionsList}>
                              <div className={styles.optionGroup}>
                                <label>
                                  Copy to:
                                  <div className={styles.copyToList}>
                                    {(field.copy_to || []).map((copyTo, copyToIndex) => (
                                      <div key={copyToIndex} className={styles.copyToItem}>
                                        <input
                                          type="text"
                                          placeholder="Nom du champ de copie"
                                          value={copyTo}
                                          onChange={(e) => {
                                            const currentCopyTo = field.copy_to || [];
                                            const newCopyTo = [...currentCopyTo];
                                            newCopyTo[copyToIndex] = e.target.value;
                                            handleFieldChange(field.id, { copy_to: newCopyTo });
                                          }}
                                          className={styles.copyToInput}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentCopyTo = field.copy_to || [];
                                            const newCopyTo = currentCopyTo.filter((_, i) => i !== copyToIndex);
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
                                        const currentCopyTo = field.copy_to || [];
                                        const newCopyTo = [...currentCopyTo, ''];
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
                                      value={field.ignore_above ?? ''}
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
                                      value={String(field.null_value ?? '')}
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
                    </>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
