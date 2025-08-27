/**
 * @file src/utils/rbac.ts
 * @description Utilitaires RBAC : normalisation de codes, constantes de permissions,
 *              helpers de vérification + utilitaire uniqueStrings().
 */

export type RbacAction = 'view' | 'create' | 'update' | 'delete' | 'export';
export const PERM_ROOMS_EXPORT = permissionCode('rooms', 'export');

/* ===========================
 *  Normalisation / génération
 * =========================== */

/**
 * Normalise un texte libre en "slug" (minuscules, ASCII, tirets).
 * Ex: "Front DéSk" -> "front-desk"
 */
export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents -> ASCII
    .replace(/[^a-z0-9]+/g, '-')     // tout le reste -> '-'
    .replace(/^-+|-+$/g, '');        // supprime tirets en bord
}

/**
 * Normalise une chaîne en "code système".
 * - minuscules ASCII
 * - remplace tout ce qui n'est pas [a-z0-9] par le séparateur ('.' par défaut)
 * - compacte les séparateurs, retire en bord
 * - si `prefix` est fourni, on préfixe une seule fois : prefix.core
 */
export function toSystemCode(
  input: string,
  opts?: { prefix?: string; separator?: '.' | '-' }
): string {
  const sep = opts?.separator ?? '.';

  const norm = (v: string) =>
    v.trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, sep)
      .replace(new RegExp(`\\${sep}+`, 'g'), sep)
      .replace(new RegExp(`^\\${sep}|\\${sep}$`, 'g'), '');

  const core = norm(input);
  if (!opts?.prefix) return core;

  const pfx = norm(opts.prefix);
  if (!pfx) return core;
  if (core === pfx) return pfx;
  if (core.startsWith(`${pfx}${sep}`)) return core;
  if (!core) return pfx;
  return `${pfx}${sep}${core}`;
}

/**
 * Construit le code d'un rôle à partir de son nom humain.
 * "Admin" -> "role.admin"
 */
export function roleCode(name: string): string {
  return toSystemCode(name, { prefix: 'role' });
}

/**
 * Construit le code d'une permission à partir de la ressource et de l'action.
 * ("rooms","view") -> "perm.rooms.view"
 */
export function permissionCode(resource: string, action: RbacAction): string {
  const res = toSystemCode(resource);
  return `perm.${res}.${action}`;
}

/**
 * Déploie toutes les permissions "perm.<resource>.<action>" pour un ensemble
 * de ressources/actions.
 */
export function expandPermissions(resources: string[], actions: RbacAction[]): string[] {
  const out: string[] = [];
  for (const r of resources) for (const a of actions) out.push(permissionCode(r, a));
  return out;
}

/* ===========================
 *  Vérifications en mémoire
 * =========================== */

/** true si au moins UNE permission requise est détenue. */
export function hasAnyPermission(
  owned: string[] | Set<string>,
  required: string | string[]
): boolean {
  const set = owned instanceof Set ? owned : new Set(owned);
  const req = Array.isArray(required) ? required : [required];
  return req.some((code) => set.has(code));
}

/** true si TOUTES les permissions requises sont détenues. */
export function hasAllPermissions(
  owned: string[] | Set<string>,
  required: string | string[]
): boolean {
  const set = owned instanceof Set ? owned : new Set(owned);
  const req = Array.isArray(required) ? required : [required];
  return req.every((code) => set.has(code));
}

/* ===========================
 *  Utilitaires génériques
 * =========================== */

/**
 * Déduplique un tableau de chaînes en conservant l'ordre, en
 * supprimant null/undefined/vides (après trim).
 * @example uniqueStrings(['a','b','a',' ',null,'c']) // -> ['a','b','c']
 */
export function uniqueStrings<T extends string>(
  arr: ReadonlyArray<T | null | undefined>
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of arr) {
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (!t) continue;
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t as T);
    }
  }
  return out;
}

/* ===========================
 *  Constantes de permissions
 * =========================== */

/** Permission d'administration RBAC (protège /api/rbac/*) */
export const PERM_RBAC_MANAGE = 'perm.rbac.manage';

/* PMS — Rooms */
export const PERM_ROOMS_VIEW   = permissionCode('rooms', 'view');
export const PERM_ROOMS_CREATE = permissionCode('rooms', 'create');
export const PERM_ROOMS_UPDATE = permissionCode('rooms', 'update');
export const PERM_ROOMS_DELETE = permissionCode('rooms', 'delete');

/* PMS — Room Types */
export const PERM_ROOMTYPES_VIEW   = permissionCode('room_types', 'view');
export const PERM_ROOMTYPES_CREATE = permissionCode('room_types', 'create');
export const PERM_ROOMTYPES_UPDATE = permissionCode('room_types', 'update');
export const PERM_ROOMTYPES_DELETE = permissionCode('room_types', 'delete');

/* (optionnel) Défauts pour seeding massif */
export const DEFAULT_RESOURCES = [
  'rooms', 'room_types', 'rates', 'reservations', 'folios',
  'housekeeping', 'maintenance', 'pos', 'spa', 'events',
  'inventory', 'contacts', 'users', 'rbac'
] as const;

export const DEFAULT_ACTIONS: Readonly<RbacAction[]> = ['view', 'create', 'update', 'delete', 'export'];
