/**
 * @file src/migrations/20250827-015-indexes-rates.ts
 * @description Index additionnels (si besoin).
 */
import { QueryInterface } from 'sequelize';

export async function up(_q: QueryInterface) {
  // Déjà couverts par uniques composites dans 012/013 — placeholder.
}

export async function down(_q: QueryInterface) {}
