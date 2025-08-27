/**
 * @file src/migrations/20250827-000-create-core-tables.ts
 * @description Baseline: crée les tables de base (users, roles, permissions, user_roles,
 * role_permissions, refresh_tokens). Les colonnes ajoutées ensuite (account_code, last_login_at)
 * seront gérées par 001-add-auth-columns.
 */
import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export async function up(q: QueryInterface) {
  // USERS
  await q.createTable('users', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    first_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // last_login_at et account_code seront ajoutées par la migration 001
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') }
  });

  // ROLES
  await q.createTable('roles', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') },
    updated_at: { type: DataTypes.DATE, allowNull: true, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') }
  });

  // PERMISSIONS
  await q.createTable('permissions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(190), allowNull: false }
  });

  // USER_ROLES (N-N)
  await q.createTable('user_roles', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') }
  });
  await q.addIndex('user_roles', ['user_id', 'role_id'], { unique: true, name: 'ux_user_roles_user_role' });

  // ROLE_PERMISSIONS (N-N)
  await q.createTable('role_permissions', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    permission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') }
  });
  await q.addIndex('role_permissions', ['role_id', 'permission_id'], { unique: true, name: 'ux_role_perm_role_permission' });

  // REFRESH_TOKENS
  await q.createTable('refresh_tokens', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    exp_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: (q.sequelize as any).literal('CURRENT_TIMESTAMP') }
  });
  await q.addIndex('refresh_tokens', ['user_id', 'exp_at'], { name: 'ix_refresh_user_exp' });
  await q.addIndex('refresh_tokens', ['token_hash'], { unique: true, name: 'ux_refresh_token_hash' });

  // Les FOREIGN KEY seront ajoutées par 003-add-rbac-fks (et par la FK de password_resets dans 002)
}

export async function down(q: QueryInterface) {
  await q.dropTable('refresh_tokens');
  await q.dropTable('role_permissions');
  await q.dropTable('user_roles');
  await q.dropTable('permissions');
  await q.dropTable('roles');
  await q.dropTable('users');
}
