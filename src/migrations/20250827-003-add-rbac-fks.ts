/**
 * @file src/migrations/20250827-003-add-rbac-fks.ts
 * @description Ajoute les FOREIGN KEY pour user_roles et role_permissions si manquantes.
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
  // user_roles.user_id -> users.id
  if (!await fkExists(q, 'user_roles', 'fk_user_roles_user')) {
    await q.addConstraint('user_roles', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_user_roles_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE', onUpdate: 'CASCADE'
    } as any);
  }
  // user_roles.role_id -> roles.id
  if (!await fkExists(q, 'user_roles', 'fk_user_roles_role')) {
    await q.addConstraint('user_roles', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'fk_user_roles_role',
      references: { table: 'roles', field: 'id' },
      onDelete: 'RESTRICT', onUpdate: 'CASCADE'
    } as any);
  }
  // role_permissions.role_id -> roles.id
  if (!await fkExists(q, 'role_permissions', 'fk_role_permissions_role')) {
    await q.addConstraint('role_permissions', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'fk_role_permissions_role',
      references: { table: 'roles', field: 'id' },
      onDelete: 'RESTRICT', onUpdate: 'CASCADE'
    } as any);
  }
  // role_permissions.permission_id -> permissions.id
  if (!await fkExists(q, 'role_permissions', 'fk_role_permissions_perm')) {
    await q.addConstraint('role_permissions', {
      fields: ['permission_id'],
      type: 'foreign key',
      name: 'fk_role_permissions_perm',
      references: { table: 'permissions', field: 'id' },
      onDelete: 'CASCADE', onUpdate: 'CASCADE'
    } as any);
  }
}

export async function down(q: QueryInterface) {
  // essayer de supprimer les contraintes
  const drop = async (table: string, name: string) => {
    try { await q.removeConstraint(table, name); } catch {}
  };
  await drop('user_roles', 'fk_user_roles_user');
  await drop('user_roles', 'fk_user_roles_role');
  await drop('role_permissions', 'fk_role_permissions_role');
  await drop('role_permissions', 'fk_role_permissions_perm');
}
