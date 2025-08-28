/**
 * @file src/migrations/20250827-000-create-core-tables.ts
 * @description Tables de base: users, roles, permissions, user_roles, role_permissions, refresh_tokens.
 */
import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(q: QueryInterface) {
  await q.createTable('users', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    first_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await q.createTable('roles', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
  });

  await q.createTable('permissions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(190), allowNull: false }
  });

  await q.createTable('user_roles', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await q.addIndex('user_roles', ['user_id', 'role_id'], { unique: true, name: 'ux_user_roles_user_role' });

  await q.createTable('role_permissions', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    permission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await q.addIndex('role_permissions', ['role_id', 'permission_id'], { unique: true, name: 'ux_role_perm_role_permission' });

  await q.createTable('refresh_tokens', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    exp_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await q.addIndex('refresh_tokens', ['user_id', 'exp_at'], { name: 'ix_refresh_user_exp' });
  await q.addIndex('refresh_tokens', ['token_hash'], { unique: true, name: 'ux_refresh_token_hash' });
}

export async function down(q: QueryInterface) {
  // ordre inverse + nettoyage des indexes/contraintes au besoin
  try { await q.removeIndex('refresh_tokens', 'ux_refresh_token_hash'); } catch {}
  try { await q.removeIndex('refresh_tokens', 'ix_refresh_user_exp'); } catch {}
  await q.dropTable('refresh_tokens');

  try { await q.removeIndex('role_permissions', 'ux_role_perm_role_permission'); } catch {}
  await q.dropTable('role_permissions');

  try { await q.removeIndex('user_roles', 'ux_user_roles_user_role'); } catch {}
  await q.dropTable('user_roles');

  await q.dropTable('permissions');
  await q.dropTable('roles');
  await q.dropTable('users');
}
