import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TargetNode } from '../TargetNode'

// Mock de reactflow
vi.mock('reactflow', () => ({
  Handle: ({ children, type, position, ...props }: any) => (
    <div 
      data-testid="handle" 
      data-type={type} 
      data-position={position} 
      {...props}
    >
      {children}
    </div>
  ),
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom'
  }
}))

describe('TargetNode', () => {
  const defaultData = {
    label: 'Test Field',
    es_type: 'keyword',
    onNameChange: vi.fn(),
    onTypeChange: vi.fn()
  }

  const defaultProps = {
    id: 'node-1',
    type: 'target',
    data: defaultData,
    selected: false,
    zIndex: 0,
    isConnectable: true,
    xPos: 0,
    yPos: 0,
    dragHandle: undefined,
    dragging: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default values', () => {
    render(<TargetNode {...defaultProps} />)
    
    expect(screen.getByText('Nom du champ:')).toBeInTheDocument()
    expect(screen.getByText('Type ES:')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Field')).toBeInTheDocument()
    expect(screen.getByDisplayValue('keyword')).toBeInTheDocument()
  })

  it('should render handle with correct position', () => {
    render(<TargetNode {...defaultProps} />)
    
    const handle = screen.getByTestId('handle')
    expect(handle).toHaveAttribute('data-position', 'left')
    expect(handle).toHaveAttribute('data-type', 'target')
  })

  it('should call onNameChange when name input changes', async () => {
    const user = userEvent.setup()
    render(<TargetNode {...defaultProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Field')
    await user.clear(nameInput)
    await user.type(nameInput, 'New Field Name')
    
    expect(defaultData.onNameChange).toHaveBeenCalledWith('node-1', 'New Field Name')
  })

  it('should call onTypeChange when type select changes', async () => {
    const user = userEvent.setup()
    render(<TargetNode {...defaultProps} />)
    
    const typeSelect = screen.getByDisplayValue('keyword')
    await user.selectOptions(typeSelect, 'text')
    
    expect(defaultData.onTypeChange).toHaveBeenCalledWith('node-1', 'text')
  })

  it('should render all supported ES types in select', () => {
    render(<TargetNode {...defaultProps} />)
    
    const typeSelect = screen.getByDisplayValue('keyword')
    expect(typeSelect).toBeInTheDocument()
    
    // Vérifier que tous les types ES sont présents
    const expectedTypes = ['keyword', 'text', 'integer', 'float', 'date', 'boolean']
    expectedTypes.forEach(type => {
      const option = screen.getByRole('option', { name: type })
      expect(option).toBeInTheDocument()
      expect(option).toHaveValue(type)
    })
  })

  it('should handle empty label value', () => {
    const dataWithEmptyLabel = {
      ...defaultData,
      label: ''
    }
    
    render(<TargetNode {...defaultProps} data={dataWithEmptyLabel} />)
    
    const nameInput = screen.getByDisplayValue('')
    expect(nameInput).toBeInTheDocument()
  })

  it('should handle missing es_type with default fallback', () => {
    const dataWithoutType = {
      ...defaultData,
      es_type: undefined
    }
    
    render(<TargetNode {...defaultProps} data={dataWithoutType} />)
    
    const typeSelect = screen.getByDisplayValue('keyword')
    expect(typeSelect).toBeInTheDocument()
  })

  it('should apply nodrag class to inputs', () => {
    const { container } = render(<TargetNode {...defaultProps} />)
    
    const nameInput = container.querySelector('input[type="text"]')
    const typeSelect = container.querySelector('select')
    
    expect(nameInput?.className).toContain('nodrag')
    expect(typeSelect?.className).toContain('nodrag')
  })

  it('should handle special characters in field names', async () => {
    const user = userEvent.setup()
    render(<TargetNode {...defaultProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Field')
    await user.clear(nameInput)
    await user.type(nameInput, 'Champ_avec_caractères_spéciaux: éàçù!@#$%^&*()')
    
    expect(defaultData.onNameChange).toHaveBeenCalledWith(
      'node-1', 
      'Champ_avec_caractères_spéciaux: éàçù!@#$%^&*()'
    )
  })

  it('should handle numeric field names', async () => {
    const user = userEvent.setup()
    render(<TargetNode {...defaultProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Field')
    await user.clear(nameInput)
    await user.type(nameInput, 'field_123')
    
    expect(defaultData.onNameChange).toHaveBeenCalledWith('node-1', 'field_123')
  })

  it('should maintain input values after user interaction', async () => {
    const user = userEvent.setup()
    render(<TargetNode {...defaultProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Field')
    const typeSelect = screen.getByDisplayValue('keyword')
    
    // Simuler des changements
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Field')
    await user.selectOptions(typeSelect, 'integer')
    
    // Vérifier que les valeurs sont maintenues
    expect(nameInput).toHaveValue('Updated Field')
    expect(typeSelect).toHaveValue('integer')
  })

  it('should handle rapid input changes', async () => {
    const user = userEvent.setup()
    render(<TargetNode {...defaultProps} />)
    
    const nameInput = screen.getByDisplayValue('Test Field')
    
    // Simuler des changements rapides
    await user.clear(nameInput)
    await user.type(nameInput, 'a')
    await user.type(nameInput, 'b')
    await user.type(nameInput, 'c')
    
    // Le clear() peut aussi déclencher un onChange, donc on vérifie au moins 3 appels
    expect(defaultData.onNameChange).toHaveBeenCalledTimes(4)
    expect(defaultData.onNameChange).toHaveBeenLastCalledWith('node-1', 'abc')
  })

  it('should render with different node IDs', () => {
    const propsWithDifferentId = {
      ...defaultProps,
      id: 'node-2'
    }
    
    render(<TargetNode {...propsWithDifferentId} />)
    
    // Le composant devrait toujours fonctionner avec un ID différent
    expect(screen.getByText('Nom du champ:')).toBeInTheDocument()
    expect(screen.getByText('Type ES:')).toBeInTheDocument()
  })
})
