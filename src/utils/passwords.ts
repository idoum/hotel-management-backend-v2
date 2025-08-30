/**
 * @file src/utils/passwords.ts
 * @description Helpers de gestion des mots de passe basés sur bcryptjs :
 *  - hashPassword: hachage sécurisé avec coût configurable
 *  - comparePassword: comparaison d’un mot de passe en clair avec un hash
 *  - needsRehash (optionnel): indique si le hash actuel devrait être ré-haché avec un coût supérieur
 */


import bcrypt from 'bcryptjs';

/**
 * Hash un mot de passe avec un coût raisonnable pour API.
 * @param password Mot de passe en clair
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare un mot de passe en clair au hash stocké.
 * @param password Mot de passe en clair
 * @param hash Hash stocké
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}


/** Lit le coût désiré depuis l'env (ex: BCRYPT_ROUNDS=10) avec bornes de sécurité. */
function desiredRounds(): number {
  const raw = Number(process.env.BCRYPT_ROUNDS ?? 10);
  // Bornes raisonnables pour éviter des lenteurs ou faiblesse
  return Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 8), 14) : 10;
}


/**
 * @function comparePassword
 * @description Compare un mot de passe en clair au hash stocké.
 * @param plain Mot de passe en clair
 * @param hash Hash bcrypt existant
 * @returns boolean vrai si correspond
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * @function needsRehash
 * @description (Optionnel) Détermine si le hash actuel utilise un coût inférieur au souhaité.
 * @param hash Hash bcrypt existant, ex: $2a$10$...
 * @returns boolean
 */
export function needsRehash(hash: string): boolean {
  // Format: $2[abzy]$CC$... => CC = cost
  const m = /^\$2[aby]?\$(\d{2})\$/i.exec(hash);
  const current = m && m[1] ? parseInt(m[1], 10) : NaN;
  return Number.isFinite(current) ? current < desiredRounds() : true;
}
