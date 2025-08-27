/**
 * @file src/utils/passwords.ts
 * @description Hash et vérification des mots de passe (bcrypt).
 */

import bcrypt from 'bcrypt';

const ROUNDS = 10;

/**
 * Hash un mot de passe en utilisant bcrypt.
 * @param plain Mot de passe en clair
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

/**
 * Compare un mot de passe avec un hash.
 * @param plain Mot de passe en clair
 * @param hash Hash bcrypt
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
