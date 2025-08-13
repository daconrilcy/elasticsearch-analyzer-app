import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { IdPolicyEditor } from '../IdPolicyEditor'
import type { IdPolicy } from '../IdPolicyEditor'

// Composant Harness pour gérer l'état contrôlé
function Harness({
  initial,
  onChange,
  onCheckIds,
  checkingIds = false,
}: {
  initial: IdPolicy;
  onChange: (p: IdPolicy) => void;
  onCheckIds: () => void;
  checkingIds?: boolean;
}) {
  const [policy, setPolicy] = React.useState(initial);
  return (
    <IdPolicyEditor
      idPolicy={policy}
      onIdPolicyChange={(next) => {
        setPolicy(next);
        onChange(next);
      }}
      onCheckIds={onCheckIds}
      checkingIds={checkingIds}
    />
  );
}

// Mock des hooks si nécessaire
// IdPolicyEditor n'utilise pas directement les hooks, mais on peut en avoir besoin

describe('IdPolicyEditor', () => {
  const mockOnIdPolicyChange = vi.fn()
  const mockOnCheckIds = vi.fn()
  
  const defaultProps = {
    idPolicy: {
      from: ['id'],
      op: 'concat' as const,
      sep: ':',
      on_conflict: 'error' as const
    } as IdPolicy,
    onIdPolicyChange: mockOnIdPolicyChange,
    onCheckIds: mockOnCheckIds,
    checkingIds: false
  }

  beforeEach(() => {
    mockOnIdPolicyChange.mockClear()
    mockOnCheckIds.mockClear()
  })

  it('should render collapsed by default', () => {
    render(<IdPolicyEditor {...defaultProps} />)
    expect(screen.getByText('Politique d\'ID')).toBeInTheDocument()
    expect(screen.queryByText('Sources d\'ID')).not.toBeInTheDocument()
  })

  it('should expand when header is clicked', async () => {
    const user = userEvent.setup()
    render(<IdPolicyEditor {...defaultProps} />)

    const expandButton = screen.getByText('+')
    await user.click(expandButton)

    expect(screen.getByText('Sources d\'ID')).toBeInTheDocument()
    expect(screen.getByText('Opération de concaténation')).toBeInTheDocument()
    expect(screen.getByText('Sécurité (optionnel)')).toBeInTheDocument()
  })

  it('should add new ID source', async () => {
    const user = userEvent.setup()
    render(<Harness initial={defaultProps.idPolicy} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} />)

    // Expand first
    const expandButton = screen.getByText('+')
    await user.click(expandButton)

    const addButton = screen.getByText('+ Ajouter une source')
    await user.click(addButton)

    expect(mockOnIdPolicyChange).toHaveBeenCalledWith({
      ...defaultProps.idPolicy,
      from: ['id', '']
    })
  })

  it('should remove ID source', async () => {
    const user = userEvent.setup()
    const idPolicy: IdPolicy = {
      ...defaultProps.idPolicy,
      from: ['id', 'name']
    }

    render(<Harness initial={idPolicy} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} />)

    // Expand first
    const expandButton = screen.getByText('+')
    await user.click(expandButton)

    const removeButtons = screen.getAllByText('×')
    await user.click(removeButtons[1]) // Remove second source

    expect(mockOnIdPolicyChange).toHaveBeenCalledWith({
      ...idPolicy,
      from: ['id']
    })
  })

  it('should update ID source value', async () => {
    const user = userEvent.setup()
    render(<Harness initial={defaultProps.idPolicy} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} />)

    // Expand first
    const expandButton = screen.getByText('+')
    await user.click(expandButton)

    const sourceInput = screen.getByDisplayValue('id')
    await user.clear(sourceInput)
    await user.type(sourceInput, 'user_id')

    // Le composant envoie chaque caractère individuellement, donc on vérifie le dernier appel
    expect(mockOnIdPolicyChange).toHaveBeenLastCalledWith({
      ...defaultProps.idPolicy,
      from: ['user_id']
    })
  })

  it('should update separator', async () => {
    const user = userEvent.setup()
    // Créer une politique avec plusieurs sources pour afficher le séparateur
    const idPolicyWithMultipleSources: IdPolicy = {
      ...defaultProps.idPolicy,
      from: ['id', 'name']
    }
    
    render(<Harness initial={idPolicyWithMultipleSources} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} />)

    // Expand first
    const expandButton = screen.getByText('+')
    await user.click(expandButton)

    const separatorInput = screen.getByDisplayValue(':')
    await user.clear(separatorInput)
    await user.type(separatorInput, '-')

    // Avec le Harness, clear() fonctionne correctement et on obtient juste '-'
    expect(mockOnIdPolicyChange).toHaveBeenLastCalledWith({
      ...idPolicyWithMultipleSources,
      sep: '-'
    })
  })

  it('should update conflict resolution', async () => {
    const user = userEvent.setup()
    render(<Harness initial={defaultProps.idPolicy} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} />)

    // Expand first
    const expandButton = screen.getByText('+')
    await user.click(expandButton)

    // Utiliser getByLabelText pour cibler le select par son label
    const conflictSelect = screen.getByLabelText('En cas de doublon:')
    expect((conflictSelect as HTMLSelectElement).value).toBe('error') // valeur initiale

    await user.selectOptions(conflictSelect, 'skip')

    expect(mockOnIdPolicyChange).toHaveBeenLastCalledWith({
      ...defaultProps.idPolicy,
      on_conflict: 'skip'
    })
  })

  it('should check IDs when button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness initial={defaultProps.idPolicy} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} />)

    // Expand first
    const expandButton = within(container).getByText('+')
    await user.click(expandButton)

    // Utiliser within(container) pour limiter la portée et éviter les matches multiples
    const checkButton = within(container).getByRole('button', { name: /Vérifier les IDs/ })
    await user.click(checkButton)

    expect(mockOnCheckIds).toHaveBeenCalled()
  })

  it('should show checking state', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness initial={defaultProps.idPolicy} onChange={mockOnIdPolicyChange} onCheckIds={mockOnCheckIds} checkingIds={true} />)

    // Expand first avec await pour s'assurer que le panneau est déplié
    const expandButton = within(container).getByText('+')
    await user.click(expandButton)

    // Utiliser within(container) et une recherche plus simple
    const checkButton = within(container).getByText('Vérification en cours...')
    expect(checkButton).toBeDisabled()
  })
})
