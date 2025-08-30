/**
 * @file src/services/rbac.service.ts
 * @description RBAC business logic: get/assign roles and permissions, checks.
 */
import User from "@/models/User";
import Role from "@/models/Role";
import Permission from "@/models/Permission";
import UserRole from "@/models/UserRole";
import RolePermission from "@/models/RolePermission";
import { uniqueStrings } from "@/utils/rbac";

/**
 * getUserRoleCodes
 * @description Returns role codes for a user using the aliased association.
 * @param userId number
 */
export async function getUserRoleCodes(userId: number): Promise<string[]> {
  const user = await User.findByPk(userId, {
    attributes: ["id"],
    include: [
      {
        // equivalent to: { model: Role, as: "roles" }
        association: User.associations.roles!,
        attributes: ["code"],
        through: { attributes: [] }
      }
    ]
  });
  if (!user) return [];
  const roles = (user as any).roles as Role[] | undefined;
  return roles ? roles.map((r) => r.code) : [];
}

/**
 * getUserPermissionCodes
 * @description Returns permission codes for a user aggregated from his roles.
 * @param userId number
 */
export async function getUserPermissionCodes(userId: number): Promise<string[]> {
  // Fetch user -> roles -> permissions using the correct aliases via association API
  const roleAssociation = User.associations.roles;
  const permissionAssociation = Role.associations.permissions;

  const include: any[] = [];
  if (roleAssociation) {
    const roleInclude: any = {
      association: roleAssociation,
      attributes: ["id"],
      through: { attributes: [] }
    };
    if (permissionAssociation) {
      roleInclude.include = [
        {
          association: permissionAssociation,
          attributes: ["code"],
          through: { attributes: [] }
        }
      ];
    }
    include.push(roleInclude);
  }

  const user = await User.findByPk(userId, {
    attributes: ["id"],
    include
  });
  if (!user) return [];

  const roles = (user as any).roles as Array<Role & { permissions?: Permission[] }> | undefined;
  if (!roles) return [];

  const codes: string[] = [];
  for (const r of roles) {
    const perms = (r.permissions ?? []) as Permission[];
    for (const p of perms) codes.push(p.code);
  }
  return uniqueStrings(codes);
}

/**
 * assignRoleToUser
 * @description Idempotently attaches a role to a user.
 * @param userId number
 * @param roleId number
 */
export async function assignRoleToUser(userId: number, roleId: number): Promise<void> {
  await UserRole.findOrCreate({ where: { user_id: userId, role_id: roleId } });
}

/**
 * revokeRoleFromUser
 * @description Removes a role from a user.
 * @param userId number
 * @param roleId number
 */
export async function revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
  await UserRole.destroy({ where: { user_id: userId, role_id: roleId } });
}

/**
 * attachPermissionToRole
 * @description Idempotently attaches a permission to a role.
 * @param roleId number
 * @param permissionId number
 */
export async function attachPermissionToRole(roleId: number, permissionId: number): Promise<void> {
  await RolePermission.findOrCreate({ where: { role_id: roleId, permission_id: permissionId } });
}

/**
 * detachPermissionFromRole
 * @description Removes a permission from a role.
 * @param roleId number
 * @param permissionId number
 */
export async function detachPermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  await RolePermission.destroy({ where: { role_id: roleId, permission_id: permissionId } });
}
