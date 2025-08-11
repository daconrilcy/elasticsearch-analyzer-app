import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock CSS modules
vi.mock('*.module.scss', () => ({
  default: {
    filePreviewPanel: 'filePreviewPanel',
    fileHeader: 'fileHeader',
    toolbar: 'toolbar',
    dataContainer: 'dataContainer',
    chunkError: 'chunkError',
    loadingState: 'loadingState',
    errorState: 'errorState',
    // Add other CSS class names as needed
  }
}))

// Configuration globale pour les tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock pour EventSource
const MockEventSource = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  url: '',
  withCredentials: false,
})) as any

MockEventSource.CONNECTING = 0
MockEventSource.OPEN = 1
MockEventSource.CLOSED = 2

global.EventSource = MockEventSource

// Mock pour URL.createObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mocked-blob-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
})

// Mock pour Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  size: content.length,
  type: options?.type || 'application/octet-stream',
}))

// Mock pour document.createElement pour les tests CSV
const originalCreateElement = document.createElement
vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
  const element = originalCreateElement.call(document, tagName)
  if (tagName === 'a') {
    const anchor = element as HTMLAnchorElement
    anchor.click = vi.fn()
    anchor.setAttribute = vi.fn()
    anchor.style = { visibility: 'hidden' } as any
    anchor.download = ''
    anchor.href = ''
  }
  return element
})

// S'assurer que document.body existe et peut recevoir des éléments
if (!document.body) {
  const body = document.createElement('body');
  document.appendChild(body);
}
