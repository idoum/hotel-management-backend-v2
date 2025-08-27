/**
 * @file src/utils/query.ts
 * @description Helpers pour parser les query params (CSV, arrays, tri multi-colonnes).
 */

import type { Order } from 'sequelize';

/**
 * Normalise une valeur (string | string[]) en tableau de chaînes non vides.
 * - "a,b,c"        -> ["a","b","c"]
 * - ["a","b"]      -> ["a","b"]
 * - undefined/null -> []
 */
export function toStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Normalise une valeur (string | number | Array) en tableau de nombres (filtrés).
 * "1,2,3" -> [1,2,3]
 * ["1","2"] -> [1,2]
 */
export function toNumberArray(input: unknown): number[] {
  return toStringArray(input)
    .map(x => Number(x))
    .filter(n => Number.isFinite(n));
}

/**
 * Construit un ORDER Sequelize à partir d'une chaîne "field:DIR,field2:DIR"
 * @param sortParam ex: "number:ASC,floor:DESC"
 * @param allowed   liste blanche des colonnes autorisées
 * @param fallback  order par défaut si rien de valide
 */
export function buildMultiSort(
  sortParam: unknown,
  allowed: readonly string[],
  fallback: Order = [['number', 'ASC']]
): Order {
  const clauses = toStringArray(sortParam);
  const order: Order = [];

  for (const clause of clauses) {
    const [fieldRaw, dirRaw] = clause.split(':').map(s => s?.trim());
    const field = fieldRaw && allowed.includes(fieldRaw) ? fieldRaw : undefined;
    const dir = dirRaw && /^(asc|desc)$/i.test(dirRaw) ? dirRaw.toUpperCase() as 'ASC'|'DESC' : 'ASC';
    if (field) {
      order.push([field, dir]);
    }
  }
  return order.length ? order : fallback;
}
