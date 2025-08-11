export function bytesFmt(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = bytes / Math.pow(k, i);
  // Forcer l'affichage d'une décimale pour les valeurs entières
  const formattedValue = value % 1 === 0 ? value.toFixed(1) : value.toFixed(1);
  
  return `${formattedValue} ${sizes[i]}`;
}

export function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  
  // Union des clés comme header
  const allKeys = new Set<string>();
  rows.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Fonction pour échapper une valeur CSV
  const escapeCSV = (value: any): string => {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Regex sur une seule ligne pour détecter les caractères spéciaux
    const needs = /[",\n]/.test(stringValue);
    
    if (needs) {
      // Doubler les guillemets et entourer de guillemets
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };
  
  // Génération des lignes CSV
  const csvRows = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => escapeCSV(row[header] || '')).join(',')
    )
  ];
  
  // Utilisation de LF pour la compatibilité cross-platform
  return csvRows.join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Vérifier que document.body existe (pour les tests)
    if (document.body) {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback pour les environnements de test
      link.click();
    }
    
    URL.revokeObjectURL(url);
  }
}
