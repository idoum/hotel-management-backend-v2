/**
 * @file src/utils/rbac.ts
 * @description Outils RBAC: normalisation de codes, générateurs, constantes.
 */

/**
 * Normalise un nom lisible en "code système".
 * - supprime les diacritiques, met en minuscule
 * - remplace tout char non [a-z0-9] par '.'
 * - compresse/trim les '.'
 * @param input libellé source
 * @param prefix préfixe optionnel: "role" / "perm"
 */
export function toSystemCode(input: string, prefix?: string): string {
  const base = input
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.+/g, '.');
  return prefix ? `${prefix}.${base}` : base;
}

/**
 * Génère un code permission "perm.resource.action".
 */
export function permissionCode(resource: string, action: string): string {
  return toSystemCode(`${resource}.${action}`, 'perm');
}

/**
 * Génère un code rôle "role.nom".
 */
export function roleCode(name: string): string {
  return toSystemCode(name, 'role');
}

/**
 * Constante: permission nécessaire pour gérer RBAC (routes /api/rbac/*).
 */
export const PERM_RBAC_MANAGE = 'perm.rbac.manage';

/** Set utilitaire (unicité). */
export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
