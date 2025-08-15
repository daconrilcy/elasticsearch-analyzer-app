import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OperationEditor } from '../OperationEditor'
import React from 'react'

// Mock des hooks - doit être avant vi.mock
vi.mock('../../../hooks', () => ({
  useOperations: vi.fn(),
  useDictionaries: vi.fn()
}))

// Import des mocks après vi.mock
import { useOperations, useDictionaries } from '../../../hooks'

// Composant Harness pour gérer l'état des opérations contrôlées
function Harness({
  initial,
  onChange,
  onRemove,
}: {
  initial: any;
  onChange: (op: any) => void;
  onRemove: () => void;
}) {
  const [op, setOp] = React.useState(initial);
  return (
    <OperationEditor
      operation={op}
      onOperationChange={(next) => {
        setOp(next);        // On réinjecte l'état
        onChange(next);     // On conserve le spy
      }}
      onRemove={onRemove}
    />
  );
}

describe('OperationEditor', () => {
  const mockUseOperations = vi.mocked(useOperations)
  const mockUseDictionaries = vi.mocked(useDictionaries)
  
  const mockOnOperationChange = vi.fn()
  const mockOnRemove = vi.fn()
  
  const defaultProps = {
    operation: { op: '' },
    onOperationChange: mockOnOperationChange,
    onRemove: mockOnRemove
  }

  beforeEach(() => {
    mockUseOperations.mockReturnValue({
      operations: ['trim', 'cast', 'map', 'join', 'filter', 'sort', 'slice', 'unique', 'custom_op'],
      loading: false,
      error: null,
      offline: false
    })
    
    mockUseDictionaries.mockReturnValue({
      dictionaries: [
        { 
          id: 'countries', 
          name: 'Pays', 
          description: 'Codes et noms des pays',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        { 
          id: 'currencies', 
          name: 'Devises', 
          description: 'Codes et noms des devises',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      loading: false,
      error: null,
      refetch: vi.fn()
    })
    
    mockOnOperationChange.mockClear()
    mockOnRemove.mockClear()
  })

  it('should render loading state', () => {
    mockUseOperations.mockReturnValue({
      operations: [],
      loading: true,
      error: null,
      offline: false
    })

    render(<OperationEditor {...defaultProps} />)
    expect(screen.getByText('Chargement des opérations...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseOperations.mockReturnValue({
      operations: [],
      loading: false,
      error: 'Failed to load',
      offline: false
    })

    render(<OperationEditor {...defaultProps} />)
    expect(screen.getByText('Erreur: Failed to load')).toBeInTheDocument()
  })

  it('should render operation selection', () => {
    render(<OperationEditor {...defaultProps} />)
    expect(screen.getByDisplayValue('Sélectionner une opération')).toBeInTheDocument()
  })

  it('should change operation', async () => {
    const user = userEvent.setup()
    render(<OperationEditor {...defaultProps} />)

    const opSelect = screen.getByDisplayValue('Sélectionner une opération')
    await user.selectOptions(opSelect, 'cast')

    expect(mockOnOperationChange).toHaveBeenCalledWith({ op: 'cast' })
  })

  it('should remove operation', async () => {
    const user = userEvent.setup()
    render(<OperationEditor {...defaultProps} />)

    const removeButton = screen.getByText('×')
    await user.click(removeButton)

    expect(mockOnRemove).toHaveBeenCalled()
  })

  describe('cast operation', () => {
    it('should show cast.to field', async () => {
      const user = userEvent.setup()
      const castOperation = { op: 'cast', to: 'number' }
      
      render(<OperationEditor 
        operation={castOperation}
        onOperationChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('cast')
      await user.selectOptions(opSelect, 'cast')

      expect(screen.getByDisplayValue('Nombre')).toBeInTheDocument()
    })

    it('should update cast.to value', async () => {
      const user = userEvent.setup()
      const castOperation = { op: 'cast', to: 'number' }
      
      render(<OperationEditor 
        operation={castOperation}
        onOperationChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const toSelect = screen.getByDisplayValue('Nombre')
      await user.selectOptions(toSelect, 'Chaîne')

      expect(mockOnOperationChange).toHaveBeenCalledWith({ op: 'cast', to: 'string' })
    })
  })

  describe('regex_replace operation', () => {
    it('should show pattern and replacement fields', async () => {
      const user = userEvent.setup()
      const regexOperation = { op: 'regex_replace', pattern: '\\d+', replacement: 'NUMBER' }
      
      render(<Harness 
        initial={regexOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('regex_replace')
      await user.selectOptions(opSelect, 'regex_replace')

      expect(screen.getByDisplayValue('\\d+')).toBeInTheDocument()
      expect(screen.getByDisplayValue('NUMBER')).toBeInTheDocument()
    })

    it('should update pattern value', async () => {
      const user = userEvent.setup()
      const regexOperation = { op: 'regex_replace', pattern: '\\d+', replacement: 'NUMBER' }
      
      render(<Harness 
        initial={regexOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const patternInput = screen.getByDisplayValue('\\d+')
      await user.clear(patternInput)
      await user.type(patternInput, '\\w+')

      expect(mockOnOperationChange).toHaveBeenCalledWith({ 
        op: 'regex_replace', 
        pattern: '\\w+', 
        replacement: 'NUMBER' 
      })
    })
  })

  describe('date_parse operation', () => {
    it('should show date formats', async () => {
      const dateOperation = { op: 'date_parse', formats: ['YYYY-MM-DD', 'MM/DD/YYYY'] }
      
      render(<OperationEditor 
        operation={dateOperation}
        onOperationChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      expect(screen.getByDisplayValue('YYYY-MM-DD')).toBeInTheDocument()
      expect(screen.getByDisplayValue('MM/DD/YYYY')).toBeInTheDocument()
    })

    it('should add new format', async () => {
      const user = userEvent.setup()
      const dateOperation = { op: 'date_parse', formats: ['YYYY-MM-DD'] }
      
      render(<OperationEditor 
        operation={dateOperation}
        onOperationChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const addButton = screen.getByText('+ Format')
      await user.click(addButton)

      expect(mockOnOperationChange).toHaveBeenCalledWith({ 
        op: 'date_parse', 
        formats: ['YYYY-MM-DD', ''] 
      })
    })
  })

  describe('dict operation', () => {
    it('should show key field', async () => {
      const user = userEvent.setup()
      const dictOperation = { op: 'dict', key: 'country_codes' }
      
      render(<Harness 
        initial={dictOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('dict')
      await user.selectOptions(opSelect, 'dict')

            const dictSelect = screen.getByLabelText('Nom du dictionnaire:')
      expect((dictSelect as HTMLSelectElement).value).toBe('')
      })

    it('should update dict name', async () => {
      const user = userEvent.setup()
      const dictOperation = { op: 'dict', key: 'country_codes' }
      
      render(<Harness 
        initial={dictOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const nameInput = screen.getByLabelText('Nom du dictionnaire:')
      await user.selectOptions(nameInput, 'countries')

      expect(mockOnOperationChange).toHaveBeenCalledWith({
        op: 'dict',
        key: 'countries'
      })
    })
  })

  describe('sort operation', () => {
    it('should show order field', async () => {
      const user = userEvent.setup()
      const sortOperation = { op: 'sort', by: 'age', order: 'asc', numeric: false, missing_last: true }
      
      render(<Harness 
        initial={sortOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('sort')
      await user.selectOptions(opSelect, 'sort')

      expect(screen.getByDisplayValue('age')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Croissant (A→Z)')).toBeInTheDocument()
    })

    it('should update sort order', async () => {
      const user = userEvent.setup()
      const sortOperation = { op: 'sort', by: 'age', order: 'asc', numeric: false, missing_last: true }
      
      render(<Harness 
        initial={sortOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const orderSelect = screen.getByDisplayValue('Croissant (A→Z)')
      await user.selectOptions(orderSelect, 'desc')

      expect(mockOnOperationChange).toHaveBeenCalledWith({ 
        op: 'sort', 
        by: 'age',
        order: 'desc',
        numeric: false,
        missing_last: true
      })
    })
  })

  describe('slice operation', () => {
    it('should show start and end fields', async () => {
      const user = userEvent.setup()
      const sliceOperation = { op: 'slice', start: 0, end: 5 }
      
      render(<Harness 
        initial={sliceOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('slice')
      await user.selectOptions(opSelect, 'slice')

      expect(screen.getByDisplayValue('')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    it('should update slice values', async () => {
      const user = userEvent.setup()
      const sliceOperation = { op: 'slice', start: 0, end: 5 }
      
      render(<Harness 
        initial={sliceOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const startInput = screen.getByDisplayValue('')
      await user.clear(startInput)
      await user.type(startInput, '2')

      expect(mockOnOperationChange).toHaveBeenCalledWith({ 
        op: 'slice', 
        start: 2, 
        end: 5 
      })
    })
  })

  describe('filter operation', () => {
    it('should show condition fields', async () => {
      const user = userEvent.setup()
      const filterOperation = { op: 'filter', condition: 'not_empty' }
      
      render(<Harness 
        initial={filterOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('filter')
      await user.selectOptions(opSelect, 'filter')

      expect(screen.getByDisplayValue('Non vide')).toBeInTheDocument()
    })

    it('should update filter condition', async () => {
      const user = userEvent.setup()
      const filterOperation = { op: 'filter', condition: 'not_empty' }
      
      render(<Harness 
        initial={filterOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const typeSelect = screen.getByDisplayValue('Non vide')
      await user.selectOptions(typeSelect, 'contains')

      expect(mockOnOperationChange).toHaveBeenCalledWith({ 
        op: 'filter', 
        condition: 'contains'
      })
    })
  })

  describe('unique operation', () => {
    it('should render without additional fields', async () => {
      const user = userEvent.setup()
      const uniqueOperation = { op: 'unique', by: 'email' }
      
      render(<OperationEditor 
        operation={uniqueOperation}
        onOperationChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('unique')
      await user.selectOptions(opSelect, 'unique')

      // Should show the by field
      expect(screen.getByDisplayValue('email')).toBeInTheDocument()
    })
  })

  describe('generic operation', () => {
    it('should show key-value pairs for unknown operations', async () => {
      const user = userEvent.setup()
      const genericOperation = { op: 'custom_op', param1: 'value1', param2: 'value2' }
      
      render(<OperationEditor 
        operation={genericOperation}
        onOperationChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('custom_op')
      await user.selectOptions(opSelect, 'custom_op')

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should update generic operation parameters', async () => {
      const user = userEvent.setup()
      const genericOperation = { op: 'custom_op', param1: 'value1' }
      
      render(<Harness
        initial={genericOperation}
        onChange={mockOnOperationChange}
        onRemove={mockOnRemove}
      />)

      const opSelect = screen.getByDisplayValue('custom_op')
      await user.selectOptions(opSelect, 'custom_op')

      const textarea = screen.getByDisplayValue('param1=value1')
      await user.clear(textarea)
      await user.type(textarea, 'param1=newvalue\nparam2=value2')

      const lastCall = mockOnOperationChange.mock.calls.at(-1)?.[0]
      expect(lastCall).toBeDefined()
      expect(lastCall?.op).toBe('custom_op')
      expect(lastCall?.param1).toBe('newvalue')
      expect(lastCall?.param2).toBe('value2')
    })
  })
})
