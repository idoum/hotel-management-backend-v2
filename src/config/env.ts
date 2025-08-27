/**
 * @file src/config/env.ts
 * @description Chargement/validation des variables d'environnement.
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Récupère une variable d'environnement obligatoire.
 * @param key Nom de la variable
 * @returns Valeur de la variable
 * @throws Error si la variable est absente
 */
export function requiredEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}
