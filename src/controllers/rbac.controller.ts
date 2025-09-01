/**
 * @file src/controllers/rbac.controller.ts
 * @description RBAC controllers aligned with frontend needs (+ legacy aliases). ASCII/UTF-8 safe.
 */
import { Request, Response } from "express";
import Role from "@/models/Role";
import Permission from "@/models/Permission";
import UserRole from "@/models/UserRole";
import RolePermission from "@/models/RolePermission";
import { permissionCode, roleCode } from "@/utils/rbac";
import {
  auditRbacRoleCreated,
  auditRbacPermissionCreated,
  auditRbacUserRoleAssigned,
  auditRbacUserRoleRevoked,
  auditRbacRolePermissionAttached,
  auditRbacRolePermissionDetached,
} from "@/services/audit.service";

// ✅ branchement vers le service (impl déjà présente dans rbac.service.ts)
import {
  getRolePermissions as svcGetRolePerms,
  replaceRolePermissions as svcReplaceRolePerms,
} from "@/services/rbac.service";

/**
 * GET /roles  (alias: /rbac/roles)
 * Returns all roles.
 */
export async function listRoles(_req: Request, res: Response) {
  const roles = await Role.findAll({
    order: [["id", "ASC"]],
    attributes: ["id", "code", "name"],
  });
  return res.json(roles);
}

/**
 * POST /roles  (alias: /rbac/roles)
 * Body: { name: string, code?: string }
 */
export async function createRole(req: Request, res: Response) {
  const { name, code } = req.body as { name: string; code?: string };
  if (!name || typeof name !== "string") return res.status(422).json({ message: "name is required" });
  const role = await Role.create({ name, code: code ?? roleCode(name) });
  await auditRbacRoleCreated(role.id, { name: role.name, code: role.code }, req);
  return res.status(201).json(role);
}

/**
 * GET /permissions  (alias: /rbac/permissions)
 * Returns all permissions.
 */
export async function listPermissions(_req: Request, res: Response) {
  const perms = await Permission.findAll({
    order: [["id", "ASC"]],
    attributes: ["id", "code", "name"],
  });
  return res.json(perms);
}

/**
 * POST /permissions  (alias: /rbac/permissions)
 * Body: { name: string, resource?: string, action?: string, code?: string }
 */
export async function createPermission(req: Request, res: Response) {
  const { name, resource, action, code } = req.body as {
    name: string;
    resource?: string;
    action?: string;
    code?: string;
  };
  if (!name || typeof name !== "string") return res.status(422).json({ message: "name is required" });

  const finalCode = code ?? (resource && action ? permissionCode(resource, action as any) : undefined);
  if (!finalCode) return res.status(400).json({ message: "Missing code or (resource+action)" });

  const perm = await Permission.create({ name, code: finalCode });
  await auditRbacPermissionCreated(perm.id, { name: perm.name, code: perm.code }, req);
  return res.status(201).json(perm);
}

/**
 * GET /roles/:roleId/permissions  (alias: /rbac/roles/:roleId/permissions)
 * Returns the permissions assigned to a role.
 */
export async function getRolePermissions(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const perms = await svcGetRolePerms(roleId);
  return res.json(perms);
}

/**
 * PUT /roles/:roleId/permissions  (alias: /rbac/roles/:roleId/permissions)
 * Body: { permissionIds: number[] }  -> replaces the mapping for this role.
 */
export async function putRolePermissions(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const { permissionIds } = (req.body ?? {}) as { permissionIds?: number[] };
  const updated = await svcReplaceRolePerms(roleId, permissionIds || []);
  return res.json(updated);
}

/**
 * POST /users/:userId/roles  (alias: /rbac/users/:userId/roles)
 * Body: { role_id: number }
 */
export async function assignUserRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const { role_id } = req.body as { role_id: number };
  if (!role_id || !Number.isInteger(role_id)) return res.status(422).json({ message: "role_id is required" });
  await UserRole.findOrCreate({ where: { user_id: userId, role_id } });
  await auditRbacUserRoleAssigned(userId, role_id, req);
  return res.status(204).send();
}

/**
 * DELETE /users/:userId/roles/:roleId  (alias: /rbac/users/:userId/roles/:roleId)
 */
export async function revokeUserRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const roleId = Number(req.params.roleId);
  await UserRole.destroy({ where: { user_id: userId, role_id: roleId } });
  await auditRbacUserRoleRevoked(userId, roleId, req);
  return res.status(204).send();
}

/**
 * Legacy fine-grained attach/detach (kept for compatibility)
 * POST /roles/:roleId/permissions  Body: { permission_id }
 * DELETE /roles/:roleId/permissions/:permId
 */
export async function attachPermissionToRole(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const { permission_id } = req.body as { permission_id: number };
  if (!permission_id) return res.status(422).json({ message: "permission_id is required" });
  await RolePermission.findOrCreate({ where: { role_id: roleId, permission_id } });
  await auditRbacRolePermissionAttached(roleId, permission_id, req);
  return res.status(204).send();
}
export async function detachPermissionFromRole(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const permId = Number(req.params.permId);
  await RolePermission.destroy({ where: { role_id: roleId, permission_id: permId } });
  await auditRbacRolePermissionDetached(roleId, permId, req);
  return res.status(204).send();
}
