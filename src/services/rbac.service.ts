/**
 * @file src/services/rbac.service.ts
 * @description Logique métier RBAC: récupérer/assigner rôles et permissions, vérifications.
 */
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import UserRole from '@/models/UserRole';
import RolePermission from '@/models/RolePermission';
import { uniqueStrings } from '@/utils/rbac';

/**
 * Retourne les codes de rôles d'un user.
 * @param userId ID utilisateur
 */
export async function getUserRoleCodes(userId: number): Promise<string[]> {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, attributes: ['code'], through: { attributes: [] } }]
  });
  if (!user) return [];
  const roles = (user as any).roles as Role[] | undefined;
  return roles ? roles.map(r => r.code) : [];
}

/**
 * Retourne les codes de permissions d'un user (via ses rôles).
 * @param userId ID utilisateur
 */
export async function getUserPermissionCodes(userId: number): Promise<string[]> {
  // Récupère les rôles -> permissions
  const roles = await Role.findAll({
    include: [{
      model: User,
      where: { id: userId },
      attributes: [],
      through: { attributes: [] }
    }, {
      model: Permission,
      attributes: ['code'],
      through: { attributes: [] }
    }]
  });

  const perms = roles.flatMap(r => (r as any).permissions as Permission[] || []).map(p => p.code);
  return uniqueStrings(perms);
}

/**
 * Assigne un rôle à un user (idempotent).
 */
export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
  await UserRole.findOrCreate({ where: { user_id: userId, role_id: roleId } });
}

/**
 * Retire un rôle d'un user.
 */
export async function revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
  await UserRole.destroy({ where: { user_id: userId, role_id: roleId } });
}

/**
 * Assigne une permission à un rôle (idempotent).
 */
export async function attachPermissionToRole(roleId: number, permissionId: number): Promise<void> {
  await RolePermission.findOrCreate({ where: { role_id: roleId, permission_id: permissionId } });
}

/**
 * Retire une permission d'un rôle.
 */
export async function detachPermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  await RolePermission.destroy({ where: { role_id: roleId, permission_id: permissionId } });
}
