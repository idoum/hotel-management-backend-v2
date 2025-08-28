// src/controllers/_date-utils.ts
/**
 * @file src/controllers/_date-utils.ts
 * @description Helpers date (sans dépendances).
 */
export function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate()+n); x.setHours(0,0,0,0); return x; }
export function formatDateOnly(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
export function daysRangeInclusive(ci: Date, coExcl: Date): string[] {
  const out: string[] = [];
  for (let d = startOfDay(ci); d.getTime() < startOfDay(coExcl).getTime(); d = addDays(d, 1)) {
    out.push(formatDateOnly(d));
  }
  return out;
}
