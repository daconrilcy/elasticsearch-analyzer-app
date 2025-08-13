import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import { MappingList } from '../MappingList'
import type { MappingOut } from '@shared/types'

describe('MappingList', () => {
  const mockMappings: MappingOut[] = [
    {
      id: '1',
      name: 'Mapping Test 1',
      source_file_id: 'file-1',
      dataset_id: 'dataset-1',
      mapping_rules: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      index_name: 'test_index_1'
    },
    {
      id: '2',
      name: 'Mapping Test 2',
      source_file_id: 'file-2',
      dataset_id: 'dataset-1',
      mapping_rules: [],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      index_name: null
    }
  ]

  it('should render empty state when no mappings', () => {
    render(<MappingList mappings={[]} />)
    
    expect(screen.getByText('Mappings')).toBeInTheDocument()
    expect(screen.getByText("Aucun mapping n'a été créé pour ce dataset.")).toBeInTheDocument()
  })

  it('should render mappings list when mappings exist', () => {
    render(<MappingList mappings={mockMappings} />)
    
    expect(screen.getByText('Mappings')).toBeInTheDocument()
    expect(screen.getByText('Mapping Test 1')).toBeInTheDocument()
    expect(screen.getByText('Mapping Test 2')).toBeInTheDocument()
  })

  it('should display index name when available', () => {
    render(<MappingList mappings={mockMappings} />)
    
    expect(screen.getByText('Index: test_index_1')).toBeInTheDocument()
  })

  it('should not display index name when not available', () => {
    const mappingsWithoutIndex = [
      {
        ...mockMappings[1],
        index_name: null
      }
    ]
    
    render(<MappingList mappings={mappingsWithoutIndex} />)
    
    expect(screen.queryByText(/Index:/)).not.toBeInTheDocument()
  })

  it('should render ingestion button for each mapping', () => {
    render(<MappingList mappings={mockMappings} />)
    
    const ingestionButtons = screen.getAllByText('Lancer l\'ingestion')
    expect(ingestionButtons).toHaveLength(2)
  })

  it('should have correct structure with section and list elements', () => {
    const { container } = render(<MappingList mappings={mockMappings} />)
    
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
    
    const list = container.querySelector('ul')
    expect(list).toBeInTheDocument()
    
    const listItems = container.querySelectorAll('li')
    expect(listItems).toHaveLength(2)
  })

  it('should apply correct CSS classes', () => {
    const { container } = render(<MappingList mappings={mockMappings} />)
    
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
    expect(section?.className).toContain('mapping-list')
    
    const mappingSection = container.querySelector('div')
    expect(mappingSection?.className).toContain('mapping-section')
  })

  it('should handle single mapping correctly', () => {
    const singleMapping = [mockMappings[0]]
    render(<MappingList mappings={singleMapping} />)
    
    expect(screen.getByText('Mapping Test 1')).toBeInTheDocument()
    expect(screen.getByText('Index: test_index_1')).toBeInTheDocument()
    
    const ingestionButtons = screen.getAllByText('Lancer l\'ingestion')
    expect(ingestionButtons).toHaveLength(1)
  })

  it('should render with complex mapping names', () => {
    const complexMappings = [
      {
        ...mockMappings[0],
        name: 'Mapping avec caractères spéciaux: éàçù!@#$%^&*()'
      }
    ]
    
    render(<MappingList mappings={complexMappings} />)
    
    expect(screen.getByText('Mapping avec caractères spéciaux: éàçù!@#$%^&*()')).toBeInTheDocument()
  })
})
