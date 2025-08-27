/**
 * @file src/utils/codegen.ts
 * @description Générateurs de codes lisibles et triables.
 */

/**
 * Génère un code sous la forme prefix.yyyymm.increment
 * ex: acc.202508.000123
 * @param prefix Préfixe (ex: 'acc')
 * @param seq Nombre (souvent l'ID en base)
 * @param d Date de référence (UTC), défaut = maintenant
 */
export function makeStampedCode(prefix: string, seq: number, d = new Date()): string {
  const ym = d.getUTCFullYear().toString() + String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${prefix}.${ym}.${String(seq).padStart(6, '0')}`;
}
