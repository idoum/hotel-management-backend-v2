/**
 * @file src/migrations/20250827-006-ensure-unique-refresh-token-hash.ts
 * @description Garantit une contrainte UNIQUE sur refresh_tokens.token_hash.
 * - Détecte si l'index existe déjà et s'il est bien unique
 * - Dé-duplique les valeurs en double avant d'ajouter l'UNIQUE
 */
import { QueryInterface } from 'sequelize';

async function getIndexInfo(q: QueryInterface, table: string, indexName: string) {
  const [rows]: any = await q.sequelize.query(
    `SELECT INDEX_NAME, NON_UNIQUE
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1`,
    { replacements: [table, indexName] }
  );
  if (!rows || rows.length === 0) return { exists: false, nonUnique: true };
  // NON_UNIQUE: 0 = unique, 1 = non unique
  return { exists: true, nonUnique: !!rows[0].NON_UNIQUE };
}

/** Supprime les doublons de token_hash en gardant le plus petit id pour chaque hash. */
async function dedupeTokenHash(q: QueryInterface) {
  // Supprime toutes les lignes dont l'id != MIN(id) pour le même token_hash
  await q.sequelize.query(
    `DELETE rt FROM refresh_tokens rt
      JOIN (
        SELECT token_hash, MIN(id) AS keep_id
          FROM refresh_tokens
         GROUP BY token_hash
        HAVING COUNT(*) > 1
      ) d
        ON d.token_hash = rt.token_hash
       AND rt.id <> d.keep_id`
  );
}

export async function up(q: QueryInterface) {
  const INDEX_NAME = 'ux_refresh_token_hash';

  const { exists, nonUnique } = await getIndexInfo(q, 'refresh_tokens', INDEX_NAME);

  if (!exists) {
    // Aucun index de ce nom -> dédupe puis ajoute UNIQUE
    await dedupeTokenHash(q);
    await q.addIndex('refresh_tokens', ['token_hash'], { unique: true, name: INDEX_NAME } as any);
    return;
  }

  if (exists && nonUnique) {
    // Un index non-unique de même nom existe -> le remplacer par un UNIQUE
    await dedupeTokenHash(q);
    try { await q.removeIndex('refresh_tokens', INDEX_NAME); } catch {}
    await q.addIndex('refresh_tokens', ['token_hash'], { unique: true, name: INDEX_NAME } as any);
  }

  // exists && !nonUnique -> déjà unique, rien à faire
}

export async function down(q: QueryInterface) {
  const INDEX_NAME = 'ux_refresh_token_hash';
  try {
    await q.removeIndex('refresh_tokens', INDEX_NAME);
  } catch {
    // no-op si déjà supprimé
  }
}
