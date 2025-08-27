/**
 * @file src/migrations/20250827-001-add-auth-columns.ts
 * @description Ajoute users.account_code (unique, nullable) et users.last_login_at (nullable).
 */
import { QueryInterface } from 'sequelize';

export async function up(q: QueryInterface) {
  const [cols]: any = await q.sequelize.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='users'`
  );
  const names = new Set(cols.map((c: any) => c.COLUMN_NAME));

  if (!names.has('account_code')) {
    await q.addColumn('users', 'account_code', { type: 'VARCHAR(32)', allowNull: true, unique: true } as any);
  }
  if (!names.has('last_login_at')) {
    await q.addColumn('users', 'last_login_at', { type: 'DATETIME', allowNull: true } as any);
  }
}

export async function down(q: QueryInterface) {
  // down safe: drop columns if exist
  try { await q.removeColumn('users', 'last_login_at'); } catch {}
  try { await q.removeColumn('users', 'account_code'); } catch {}
}
