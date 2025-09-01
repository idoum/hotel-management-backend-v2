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
import sequelize from "@/config/db";

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

/* -------------------------------------------------------------------------- */
/*                         Helpers alignés aux nouveaux UI                    */
/* -------------------------------------------------------------------------- */

/**
 * getRolePermissions
 * @description Returns the permissions assigned to a given role (id, code, name).
 * @param roleId number
 */
export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  const role = await Role.findByPk(roleId, {
    attributes: ["id", "code", "name"],
    include: [
      {
        association: Role.associations.permissions!,
        attributes: ["id", "code", "name"],
        through: { attributes: [] },
        required: false
      }
    ]
  });
  if (!role) return [];
  // @ts-ignore
  return ((role as any).permissions as Permission[] | undefined) ?? [];
}

/**
 * replaceRolePermissions
 * @description Replaces (idempotently) the set of permissions for a role.
 * @param roleId number
 * @param permissionIds number[]
 * @returns Updated list of Permission rows for the role
 */
export async function replaceRolePermissions(roleId: number, permissionIds: number[]): Promise<Permission[]> {
  const cleanIds = Array.from(
    new Set((permissionIds || []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))
  );

  // compute diff vs existing
  const existing = await RolePermission.findAll({
    where: { role_id: roleId },
    attributes: ["permission_id"]
  });
  const current = new Set(existing.map((rp) => rp.get("permission_id") as number));
  const next = new Set(cleanIds);

  const toAdd: number[] = [];
  const toRemove: number[] = [];
  next.forEach((pid) => { if (!current.has(pid)) toAdd.push(pid); });
  current.forEach((pid) => { if (!next.has(pid)) toRemove.push(pid); });

  // apply in a transaction
  await sequelize.transaction(async (t) => {
    if (toAdd.length) {
      await RolePermission.bulkCreate(
        toAdd.map((pid) => ({ role_id: roleId, permission_id: pid })),
        { ignoreDuplicates: true, transaction: t }
      );
    }
    if (toRemove.length) {
      await RolePermission.destroy({
        where: { role_id: roleId, permission_id: toRemove } as any,
        transaction: t
      });
    }
  });

  // return updated set
  const updated = await Permission.findAll({
    attributes: ["id", "code", "name"],
    include: [
      {
        association: Permission.associations.roles!,
        attributes: [],
        through: { attributes: [] },
        where: { id: roleId },
        required: true
      }
    ],
    order: [["id", "ASC"]]
  });

  return updated;
}
