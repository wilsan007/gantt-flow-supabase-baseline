/**
 * Export Utilities - Fonctions d'export CSV
 * Pattern: Stripe/Notion - Export simple et efficace
 */

/**
 * Convertit un tableau d'objets en CSV
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: Array<{ key: keyof T; label: string }>
): string {
  if (data.length === 0) return '';

  // Si pas de colonnes spécifiées, utiliser toutes les clés du premier objet
  const headers = columns ? columns.map(col => col.label) : Object.keys(data[0]);

  const keys = columns ? columns.map(col => col.key as string) : Object.keys(data[0]);

  // En-têtes
  const csvHeaders = headers.join(',');

  // Lignes de données
  const csvRows = data.map(row => {
    return keys
      .map(key => {
        const value = row[key];

        // Gérer les valeurs null/undefined
        if (value === null || value === undefined) return '';

        // Gérer les dates
        if (value instanceof Date) {
          return value.toLocaleDateString('fr-FR');
        }

        // Gérer les objets/tableaux
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }

        // Échapper les guillemets et virgules
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Télécharge un fichier CSV
 */
export function downloadCSV(data: string, filename: string = 'export.csv'): void {
  // Ajouter BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Exporte des données directement en CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: Array<{ key: keyof T; label: string }>
): void {
  const csv = convertToCSV(data, columns);
  downloadCSV(csv, filename);
}

/**
 * Formate une date pour l'export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
}

/**
 * Formate un montant pour l'export
 */
export function formatCurrencyForExport(
  amount: number | null | undefined,
  currency: string = 'EUR'
): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'DJF' ? 0 : 2,
    maximumFractionDigits: currency === 'DJF' ? 0 : 2,
  }).format(amount);
}
