/**
 * @file src/config/env.ts
 * @description Chargement/validation des variables d'environnement.
 */
import dotenv from 'dotenv';
dotenv.config();

/**
 * Récupère une variable d'environnement obligatoire.
 * Accepte la chaîne vide '' (utile si DB_PASS est vide).
 * @param key Nom de la variable
 * @returns Valeur (string, possiblement '')
 * @throws Error si la variable est absente (undefined)
 */
export function requiredEnv(key: string): string {
  const v = process.env[key];
  if (v === undefined) { // <-- différence: on n'interdit plus ''
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

/**
 * Récupère une variable optionnelle, avec défaut.
 * @param key Nom de la variable
 * @param def Valeur par défaut si undefined
 */
export function optionalEnv(key: string, def?: string): string | undefined {
  const v = process.env[key];
  return v === undefined ? def : v;
}
