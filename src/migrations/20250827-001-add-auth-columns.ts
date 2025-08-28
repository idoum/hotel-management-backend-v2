/**
 * @file src/migrations/20250827-001-add-auth-columns.ts
 * @description Ajoute users.account_code (unique, nullable) et users.last_login_at (nullable).
 */
import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  const [cols]: any = await q.sequelize.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='users'`
  );
  const names = new Set(cols.map((c: any) => c.COLUMN_NAME));

  if (!names.has('account_code')) {
    await q.addColumn('users', 'account_code', { type: DataTypes.STRING(32), allowNull: true });
    // index unique séparé (plus fiable qu'unique dans addColumn)
    try { await q.addIndex('users', ['account_code'], { unique: true, name: 'ux_users_account_code' } as any); } catch {}
  }

  if (!names.has('last_login_at')) {
    await q.addColumn('users', 'last_login_at', { type: DataTypes.DATE, allowNull: true });
  }
}

export async function down(q: QueryInterface) {
  try { await q.removeIndex('users', 'ux_users_account_code'); } catch {}
  try { await q.removeColumn('users', 'last_login_at'); } catch {}
  try { await q.removeColumn('users', 'account_code'); } catch {}
}
