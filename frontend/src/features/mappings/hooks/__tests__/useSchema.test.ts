import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSchema, useFieldTypes, useOperations, useSchemaVersion } from '../useSchema'

// Mock de fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock de import.meta.env
vi.stubEnv('VITE_API_BASE', '/api/v1')

describe('useSchema', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should fetch schema successfully', async () => {
    const mockSchema = {
      $id: '2-2.schema.json',
      properties: {
        fields: {
          items: {
            properties: {
              type: {
                enum: ['text', 'keyword', 'nested', 'object']
              },
              pipeline: {
                items: {
                  oneOf: [
                    { $ref: '#/$defs/OpTrim' },
                    { $ref: '#/$defs/OpCast' }
                  ]
                }
              }
            }
          }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchema
    })

    const { result } = renderHook(() => useSchema())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/mappings/schema')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSchema())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Network error')
    })
  })

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    const { result } = renderHook(() => useSchema())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to fetch schema: 500 Internal Server Error')
    })
  })

  it('should extract field types correctly', async () => {
    const mockSchema = {
      $id: '2-2.schema.json',
      properties: {
        fields: {
          items: {
            properties: {
              type: {
                enum: ['text', 'keyword', 'nested', 'object', 'long', 'double']
              }
            }
          }
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchema
    })

    const { result } = renderHook(() => useFieldTypes())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    // Le hook filtre les types 'nested' et 'object', donc on s'attend seulement aux types primitifs
    expect(result.current.fieldTypes).toEqual(['text', 'keyword', 'long', 'double'])
  })

  it('should extract operations correctly', async () => {
    const mockSchema = {
      $id: '2-2.schema.json',
      properties: {
        fields: {
          items: {
            properties: {
              pipeline: {
                items: {
                  oneOf: [
                    { $ref: '#/$defs/OpTrim' },
                    { $ref: '#/$defs/OpCast' },
                    { $ref: '#/$defs/OpMap' }
                  ]
                }
              }
            }
          }
        }
      },
      $defs: {
        OpTrim: { type: 'object', properties: { op: { const: 'trim' } } },
        OpCast: { type: 'object', properties: { op: { const: 'cast' } } },
        OpMap: { type: 'object', properties: { op: { const: 'map' } } }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchema
    })

    const { result } = renderHook(() => useOperations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(result.current.operations).toEqual(['trim', 'cast', 'map'])
  })

  it('should get schema version', async () => {
    const mockSchema = {
      $id: '2-2.schema.json'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSchema
    })

    const { result } = renderHook(() => useSchemaVersion())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(result.current.version).toBe('2-2')
  })
})
