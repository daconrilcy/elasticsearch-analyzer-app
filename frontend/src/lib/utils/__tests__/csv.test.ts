import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bytesFmt, toCSV, downloadCSV } from '../csv';

describe('csv utils', () => {
  // Mocks pour les APIs du navigateur
  beforeEach(() => {
    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        download: '',
        href: '',
        style: { visibility: '' },
        // Simuler un vrai Node DOM
        nodeType: 1,
        nodeName: tagName.toUpperCase(),
        parentNode: null,
        childNodes: [],
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as any;
      return element;
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    
    // Mock URL.revokeObjectURL
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.body
    Object.defineProperty(document, 'body', {
      value: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bytesFmt', () => {
    it('devrait formater 0 bytes', () => {
      expect(bytesFmt(0)).toBe('0 B');
    });

    it('devrait formater des bytes', () => {
      expect(bytesFmt(10)).toBe('10.0 B');
      expect(bytesFmt(500)).toBe('500.0 B');
    });

    it('devrait formater des kilobytes', () => {
      expect(bytesFmt(1024)).toBe('1.0 KB');
      expect(bytesFmt(2048)).toBe('2.0 KB');
      expect(bytesFmt(1536)).toBe('1.5 KB');
    });

    it('devrait formater des megabytes', () => {
      expect(bytesFmt(1024 * 1024)).toBe('1.0 MB');
      expect(bytesFmt(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('devrait formater des gigabytes', () => {
      expect(bytesFmt(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(bytesFmt(3.7 * 1024 * 1024 * 1024)).toBe('3.7 GB');
    });
  });

  describe('toCSV', () => {
    it('devrait retourner une chaîne vide pour un tableau vide', () => {
      expect(toCSV([])).toBe('');
    });

    it('devrait générer un CSV simple', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      
      const expected = 'name,age\nJohn,30\nJane,25';
      expect(toCSV(data)).toBe(expected);
    });

    it('devrait gérer les valeurs nulles et undefined', () => {
      const data = [
        { name: 'John', age: 30, city: null },
        { name: 'Jane', age: undefined, city: 'Paris' },
      ];
      
      const expected = 'name,age,city\nJohn,30,\nJane,,Paris';
      expect(toCSV(data)).toBe(expected);
    });

    it('devrait échapper les virgules', () => {
      const data = [
        { name: 'John, Jr.', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      
      const expected = 'name,age\n"John, Jr.",30\nJane,25';
      expect(toCSV(data)).toBe(expected);
    });

    it('devrait échapper les guillemets', () => {
      const data = [
        { name: 'John "The Rock"', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      
      const expected = 'name,age\n"John ""The Rock""",30\nJane,25';
      expect(toCSV(data)).toBe(expected);
    });

    it('devrait échapper les retours à la ligne', () => {
      const data = [
        { name: 'John\nDoe', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      
      const expected = 'name,age\n"John\nDoe",30\nJane,25';
      expect(toCSV(data)).toBe(expected);
    });

    it('devrait gérer les objets complexes', () => {
      const data = [
        { name: 'John', metadata: { city: 'NYC', country: 'USA' } },
        { name: 'Jane', metadata: { city: 'Paris', country: 'France' } },
      ];
      
      const expected = 'name,metadata\nJohn,"{""city"":""NYC"",""country"":""USA""}"\nJane,"{""city"":""Paris"",""country"":""France""}"';
      expect(toCSV(data)).toBe(expected);
    });

    it('devrait gérer les colonnes manquantes', () => {
      const data = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25 },
        { name: 'Bob', city: 'London' },
      ];
      
      const expected = 'name,age,city\nJohn,30,NYC\nJane,25,\nBob,,London';
      expect(toCSV(data)).toBe(expected);
    });
  });

  describe('downloadCSV', () => {
    it('devrait créer un lien de téléchargement', () => {
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const filename = 'test.csv';
      
      downloadCSV(csvContent, filename);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
