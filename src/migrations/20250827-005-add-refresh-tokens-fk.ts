/**
 * @file src/migrations/20250827-005-add-refresh-tokens-fk.ts
 * @description Ajoute la contrainte FK refresh_tokens.user_id → users.id si manquante.
 */
import { QueryInterface } from 'sequelize';

async function fkExists(q: QueryInterface, table: string, name: string) {
  const [rows]: any = await q.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    { replacements: [table, name] }
  );
  return rows.length > 0;
}

export async function up(q: QueryInterface) {
  // S'assure que la colonne existe (baseline 000 l'a créée)
  // Ajoute la FK uniquement si absente
  const FK_NAME = 'fk_refresh_tokens_user';
  if (!(await fkExists(q, 'refresh_tokens', FK_NAME))) {
    await q.addConstraint('refresh_tokens', {
      fields: ['user_id'],
      type: 'foreign key',
      name: FK_NAME,
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    } as any);
  }
}

export async function down(q: QueryInterface) {
  try {
    await q.removeConstraint('refresh_tokens', 'fk_refresh_tokens_user');
  } catch {}
}
