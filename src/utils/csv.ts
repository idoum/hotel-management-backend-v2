/**
 * @file src/utils/csv.ts
 * @description Helpers de génération CSV sans dépendance externe.
 */

/** Échappe une valeur pour CSV RFC4180-ish. */
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Convertit des enregistrements en CSV.
 * @param headers Entêtes (ordre des colonnes)
 * @param rows    Lignes (objet clé/valeur)
 */
export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const head = headers.map(csvEscape).join(',');
  const body = rows.map(r => headers.map(h => csvEscape((r as any)[h])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}
