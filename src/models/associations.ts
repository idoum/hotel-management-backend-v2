/**
 * @file src/models/associations.ts
 * @description Enregistre toutes les associations Sequelize pour refléter les FKs réelles :
 *  - Users ↔ Roles (N–N via user_roles)
 *  - Roles ↔ Permissions (N–N via role_permissions)
 *  - User → RefreshTokens (1–N, ON DELETE CASCADE)
 *  - User → PasswordResets (1–N, ON DELETE CASCADE)
 *  - User → ActionLogs (1–N, ON DELETE SET NULL)
 *  - RoomType → Rooms (1–N, ON DELETE RESTRICT)
 *
 * ⚠️ Appelez registerAssociations() AVANT tout sequelize.sync() (si vous l'utilisez en dev)
 *    et une seule fois au démarrage (idempotent).
 */

import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import UserRole from '@/models/UserRole';
import RolePermission from '@/models/RolePermission';
import RefreshToken from '@/models/RefreshToken';
import PasswordReset from '@/models/PasswordReset';
import ActionLog from '@/models/ActionLog';
import RoomType from '@/models/RoomType';
import Room from '@/models/Room';

let registered = false;

/**
 * Enregistre les associations (idempotent).
 * @returns void
 */
export function registerAssociations(): void {
  if (registered) return;

  /* =====================
   * RBAC (users/roles/permissions)
   * ===================== */

  // Users ↔ Roles (N–N via user_roles)
  // FKs réelles (migration 003) :
  //  - user_roles.user_id  → users.id  (CASCADE)
  //  - user_roles.role_id  → roles.id  (RESTRICT)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });

  // Roles ↔ Permissions (N–N via role_permissions)
  // FKs réelles (migration 003) :
  //  - role_permissions.role_id       → roles.id       (RESTRICT)
  //  - role_permissions.permission_id → permissions.id (CASCADE)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Tables de jointure (pratique pour l’admin/debug)
  UserRole.belongsTo(User,   { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE',  onUpdate: 'CASCADE' });
  UserRole.belongsTo(Role,   { foreignKey: 'role_id', as: 'role', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
  RolePermission.belongsTo(Role,       { foreignKey: 'role_id',       as: 'role',       onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
  RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission', onDelete: 'CASCADE',  onUpdate: 'CASCADE' });

  /* =====================
   * Auth (refresh tokens / password resets)
   * ===================== */

  // User → RefreshTokens (1–N)
  // FK réelle (migration 005) : refresh_tokens.user_id → users.id (CASCADE)
  User.hasMany(RefreshToken, {
    foreignKey: 'user_id',
    as: 'refreshTokens',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  RefreshToken.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // User → PasswordResets (1–N)
  // FK réelle (migration 002) : password_resets.user_id → users.id (CASCADE)
  User.hasMany(PasswordReset, {
    foreignKey: 'user_id',
    as: 'passwordResets',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  PasswordReset.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  /* =====================
   * Audit (action_logs)
   * ===================== */

  // User → ActionLogs (1–N)
  // FK réelle (migration 004) : action_logs.actor_user_id → users.id (SET NULL)
  User.hasMany(ActionLog, {
    foreignKey: 'actor_user_id',
    as: 'actionLogs'
  });
  ActionLog.belongsTo(User, {
    foreignKey: 'actor_user_id',
    as: 'actor',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  /* =====================
   * PMS (room_types / rooms)
   * ===================== */

  // RoomType → Rooms (1–N)
  // FK réelle (migration 008) : rooms.room_type_id → room_types.id (RESTRICT)
  RoomType.hasMany(Room, {
    foreignKey: 'room_type_id',
    as: 'rooms'
  });
  Room.belongsTo(RoomType, {
    foreignKey: 'room_type_id',
    as: 'roomType',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });

  registered = true;
}
