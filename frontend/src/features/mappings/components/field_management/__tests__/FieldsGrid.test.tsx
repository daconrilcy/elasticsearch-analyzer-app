import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldsGrid } from '../FieldsGrid'
import type { Field } from '../FieldsGrid'
import React from 'react'

// Mock des hooks - doit être avant vi.mock
vi.mock('../../../hooks', () => ({
  useFieldTypes: vi.fn(),
  useOperations: vi.fn()
}))

// Import des mocks après vi.mock
import { useFieldTypes, useOperations } from '../../../hooks'

// Composant Harness pour gérer l'état des champs contrôlés
function Harness({
  initial,
  onChange,
  onAdd,
  onRemove,
  onFieldsReorder,
}: {
  initial: Field[];
  onChange: (id: string, field: Partial<Field>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onFieldsReorder: (fields: Field[]) => void;
}) {
  const [fields, setFields] = React.useState(initial);
  
  const handleFieldChange = (id: string, changes: Partial<Field>) => {
    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, ...changes } : field
    );
    setFields(updatedFields);
    onChange(id, changes);
  };

  const handleAddField = () => {
    onAdd();
  };

  const handleRemoveField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    setFields(updatedFields);
    onRemove(id);
  };

  const handleFieldsReorder = (newFields: Field[]) => {
    setFields(newFields);
    onFieldsReorder(newFields);
  };

  return (
    <FieldsGrid
      fields={fields}
      onAddField={handleAddField}
      onRemoveField={handleRemoveField}
      onFieldChange={handleFieldChange}
      onFieldsReorder={handleFieldsReorder}
    />
  );
}

describe('FieldsGrid', () => {
  const mockUseFieldTypes = vi.mocked(useFieldTypes)
  const mockUseOperations = vi.mocked(useOperations)
  
  const mockOnFieldsChange = vi.fn()
  const mockOnAddField = vi.fn()
  const mockOnRemoveField = vi.fn()
  const mockOnFieldChange = vi.fn()
  const mockOnFieldsReorder = vi.fn()
  
  const defaultProps = {
    fields: [],
    onFieldsChange: mockOnFieldsChange,
    onAddField: mockOnAddField,
    onRemoveField: mockOnRemoveField,
    onFieldChange: mockOnFieldChange,
    onFieldsReorder: mockOnFieldsReorder
  }

  beforeEach(() => {
    mockUseFieldTypes.mockReturnValue({
      fieldTypes: ['text', 'keyword', 'long', 'double', 'date', 'boolean'],
      loading: false,
      error: null,
      offline: false
    })
    
    mockUseOperations.mockReturnValue({
      operations: ['trim', 'cast', 'map', 'join', 'filter'],
      loading: false,
      error: null,
      offline: false
    })
    
    mockOnFieldsChange.mockClear()
    mockOnAddField.mockClear()
    mockOnRemoveField.mockClear()
    mockOnFieldChange.mockClear()
    mockOnFieldsReorder.mockClear()
  })

  it('should render loading state', () => {
    mockUseFieldTypes.mockReturnValue({
      fieldTypes: [],
      loading: true,
      error: null,
      offline: false
    })

    render(<FieldsGrid {...defaultProps} />)
    expect(screen.getByText('Chargement du schéma...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseFieldTypes.mockReturnValue({
      fieldTypes: [],
      loading: false,
      error: 'Failed to load',
      offline: false
    })

    render(<FieldsGrid {...defaultProps} />)
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(<FieldsGrid {...defaultProps} />)
    expect(screen.getByText('Aucun champ défini')).toBeInTheDocument()
    expect(screen.getByText('Commencez par ajouter votre premier champ de mapping')).toBeInTheDocument()
  })

  it('should render fields correctly', () => {
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)
    expect(screen.getByDisplayValue('name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('text')).toBeInTheDocument()
  })

  it('DEBUG: should expand field and show details', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)
    
    // Vérifier que le bouton d'expansion est présent
    const expandButton = screen.getByRole('button', { name: '+' })
    expect(expandButton).toBeInTheDocument()
    
    // Cliquer pour développer
    await user.click(expandButton)
    
    // Vérifier que les détails sont affichés
    expect(screen.getByText('Sources d\'entrée')).toBeInTheDocument()
    expect(screen.getByText('Pipeline de transformation')).toBeInTheDocument()
    expect(screen.getByText('Options Elasticsearch')).toBeInTheDocument()
  })

  it('DEBUG: should show field details without expanding (basic render test)', () => {
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: [{ op: 'trim' }],
        copy_to: ['search_field']
      }
    ]

    // Rendu direct sans expansion pour voir si le composant de base fonctionne
    render(<FieldsGrid {...defaultProps} fields={fields} />)
    
    // Vérifier que les éléments de base sont présents
    expect(screen.getByDisplayValue('name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('text')).toBeInTheDocument()
    
    // Vérifier que le bouton d'expansion est présent
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
    
    // Debug: afficher le HTML pour voir ce qui est rendu
    console.log('HTML rendu:', document.body.innerHTML)
  })

  it('should add new field', async () => {
    const user = userEvent.setup()
    render(<FieldsGrid {...defaultProps} />)

    const addButton = screen.getByText('+ Ajouter un champ')
    await user.click(addButton)

    expect(mockOnAddField).toHaveBeenCalled()
  })

  it('should remove field', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)

    const removeButton = screen.getByText('×')
    await user.click(removeButton)

    expect(mockOnRemoveField).toHaveBeenCalledWith('1')
  })

  it('should change field target', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<Harness 
      initial={fields}
      onChange={mockOnFieldChange}
      onAdd={mockOnAddField}
      onRemove={mockOnRemoveField}
      onFieldsReorder={mockOnFieldsReorder}
    />)

    const targetInput = screen.getByDisplayValue('name')
    await user.clear(targetInput)
    await user.type(targetInput, 'full_name')

    expect(mockOnFieldChange).toHaveBeenLastCalledWith('1', {
      target: 'full_name'
    })
  })

  it('should change field type', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)

    const typeSelect = screen.getByDisplayValue('text')
    await user.selectOptions(typeSelect, 'keyword')

    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      type: 'keyword'
    })
  })

  it('should add input column', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    const addInputButton = screen.getByText('+ Ajouter une colonne')
    await user.click(addInputButton)

    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      input: [{ kind: 'column', name: 'name' }, { kind: 'column', name: '' }]
    })
  })

  it('should remove input column', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [
          { kind: 'column', name: 'name' },
          { kind: 'column', name: 'surname' }
        ],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    // Cibler spécifiquement le bouton de suppression du deuxième input (surname)
    // Le premier bouton × est pour supprimer le champ, le deuxième est pour supprimer le premier input
    const removeButtons = screen.getAllByText('×')
    // Supprimer le deuxième input (surname), donc garder le premier (name)
    // Si le composant supprime le premier input au lieu du deuxième, ajustons l'index
    await user.click(removeButtons[2]) // Try third button instead of second

    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      input: [{ kind: 'column', name: 'name' }]
    })
  })

  it('should change input column name', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<Harness 
      initial={fields}
      onChange={mockOnFieldChange}
      onAdd={mockOnAddField}
      onRemove={mockOnRemoveField}
      onFieldsReorder={mockOnFieldsReorder}
    />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    // Cibler spécifiquement l'input de la colonne d'entrée par son placeholder
    const inputName = screen.getByPlaceholderText('Nom de la colonne')
    await user.clear(inputName)
    await user.type(inputName, 'full_name')

    expect(mockOnFieldChange).toHaveBeenLastCalledWith('1', {
      input: [{ kind: 'column', name: 'full_name' }]
    })
  })

  it('should add operation to pipeline', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: []
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    const addOperationButton = screen.getByText('+ Ajouter une opération')
    await user.click(addOperationButton)

    // Le composant envoie l'objet complet du champ avec la nouvelle opération
    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      id: '1',
      target: 'name',
      type: 'text',
      input: [{ kind: 'column', name: 'name' }],
      pipeline: [{ op: 'trim' }]
    })
  })

  it('should remove operation from pipeline', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: [{ op: 'trim' }]
      }
    ]

    render(<FieldsGrid {...defaultProps} fields={fields} />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    // Il y a plusieurs boutons × : 
    // - Le premier est pour supprimer le champ entier
    // - Le deuxième est pour supprimer le premier input
    // - Le troisième est pour supprimer l'opération
    const removeButtons = screen.getAllByText('×')
    // Supprimer l'opération (troisième bouton ×)
    await user.click(removeButtons[2])

    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      pipeline: []
    })
  })

  it('should change operation', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: [{ op: 'trim' }]
      }
    ]

    render(<Harness 
      initial={fields}
      onChange={mockOnFieldChange}
      onAdd={mockOnAddField}
      onRemove={mockOnRemoveField}
      onFieldsReorder={mockOnFieldsReorder}
    />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    const operationSelect = screen.getByDisplayValue('trim')
    await user.selectOptions(operationSelect, 'cast')

    expect(mockOnFieldChange).toHaveBeenLastCalledWith('1', {
      pipeline: [{ op: 'cast' }]
    })
  })

  it('should add copy_to field', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: [],
        copy_to: ['search_field']
      }
    ]

    render(<Harness 
      initial={fields}
      onChange={mockOnFieldChange}
      onAdd={mockOnAddField}
      onRemove={mockOnRemoveField}
      onFieldsReorder={mockOnFieldsReorder}
    />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    const addCopyToButton = screen.getByText('+ Ajouter un champ de copie')
    await user.click(addCopyToButton)

    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      copy_to: ['search_field', '']
    })
  })

  it('should remove copy_to field', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: [],
        copy_to: ['search_field', 'another_field']
      }
    ]

    render(<Harness 
      initial={fields}
      onChange={mockOnFieldChange}
      onAdd={mockOnAddField}
      onRemove={mockOnRemoveField}
      onFieldsReorder={mockOnFieldsReorder}
    />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    // Il y a plusieurs boutons × : 
    // - Le premier est pour supprimer le champ entier
    // - Le deuxième est pour supprimer le premier input
    // - Le troisième est pour supprimer le premier copy_to
    // - Le quatrième est pour supprimer le deuxième copy_to
    const removeCopyToButtons = screen.getAllByText('×')
    // Supprimer le deuxième copy_to (another_field), donc garder le premier (search_field)
    await user.click(removeCopyToButtons[3]) // Remove second copy_to

    expect(mockOnFieldChange).toHaveBeenCalledWith('1', {
      copy_to: ['search_field']
    })
  })

  it('should change copy_to field name', async () => {
    const user = userEvent.setup()
    const fields: Field[] = [
      {
        id: '1',
        target: 'name',
        type: 'text',
        input: [{ kind: 'column', name: 'name' }],
        pipeline: [],
        copy_to: ['search_field']
      }
    ]

    render(<Harness 
      initial={fields}
      onChange={mockOnFieldChange}
      onAdd={mockOnAddField}
      onRemove={mockOnRemoveField}
      onFieldsReorder={mockOnFieldsReorder}
    />)
    
    // Déplier le champ avant de chercher les contrôles internes
    const expand = screen.getByRole('button', { name: '+' })
    await user.click(expand)
    
    const copyToInput = screen.getByDisplayValue('search_field')
    await user.clear(copyToInput)
    await user.type(copyToInput, 'full_text_search')

    expect(mockOnFieldChange).toHaveBeenLastCalledWith('1', {
      copy_to: ['full_text_search']
    })
  })
})
