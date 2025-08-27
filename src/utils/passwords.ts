/**
 * @file src/utils/passwords.ts
 * @description Hash et vérification de mot de passe via bcryptjs.
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
