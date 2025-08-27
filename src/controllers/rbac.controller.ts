/**
 * @file src/controllers/rbac.controller.ts
 * @description Endpoints RBAC avec audit.
 */
import { Request, Response } from 'express';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import UserRole from '@/models/UserRole';
import RolePermission from '@/models/RolePermission';
import { permissionCode, roleCode } from '@/utils/rbac';
import {
  auditRbacRoleCreated, auditRbacPermissionCreated,
  auditRbacUserRoleAssigned, auditRbacUserRoleRevoked,
  auditRbacRolePermissionAttached, auditRbacRolePermissionDetached
} from '@/services/audit.service';

/** GET /api/rbac/roles */
export async function listRoles(_req: Request, res: Response) {
  const roles = await Role.findAll({ order: [['id', 'ASC']] });
  res.json(roles);
}

/** POST /api/rbac/roles { name, code? } */
export async function createRole(req: Request, res: Response) {
  const { name, code } = req.body as { name: string; code?: string };
  const role = await Role.create({ name, code: code ?? roleCode(name) });
  await auditRbacRoleCreated(role.id, { name: role.name, code: role.code }, req);
  res.status(201).json(role);
}

/** GET /api/rbac/permissions */
export async function listPermissions(_req: Request, res: Response) {
  const perms = await Permission.findAll({ order: [['id', 'ASC']] });
  res.json(perms);
}

/** POST /api/rbac/permissions { name, resource?, action?, code? } */
export async function createPermission(req: Request, res: Response) {
  const { name, resource, action, code } = req.body as { name: string; resource?: string; action?: string; code?: string };
  const finalCode = code ?? (resource && action ? permissionCode(resource, action as any) : undefined);
  if (!finalCode) return res.status(400).json({ message: 'Missing code or (resource+action)' });

  const perm = await Permission.create({ name, code: finalCode });
  await auditRbacPermissionCreated(perm.id, { name: perm.name, code: perm.code }, req);
  res.status(201).json(perm);
}

/** POST /api/rbac/users/:userId/roles { role_id } */
export async function assignUserRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const { role_id } = req.body as { role_id: number };
  await UserRole.findOrCreate({ where: { user_id: userId, role_id } });
  await auditRbacUserRoleAssigned(userId, role_id, req);
  res.status(204).send();
}

/** DELETE /api/rbac/users/:userId/roles/:roleId */
export async function revokeUserRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const roleId = Number(req.params.roleId);
  await UserRole.destroy({ where: { user_id: userId, role_id: roleId } });
  await auditRbacUserRoleRevoked(userId, roleId, req);
  res.status(204).send();
}

/** POST /api/rbac/roles/:roleId/permissions { permission_id } */
export async function attachPermissionToRole(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const { permission_id } = req.body as { permission_id: number };
  await RolePermission.findOrCreate({ where: { role_id: roleId, permission_id } });
  await auditRbacRolePermissionAttached(roleId, permission_id, req);
  res.status(204).send();
}

/** DELETE /api/rbac/roles/:roleId/permissions/:permId */
export async function detachPermissionFromRole(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const permId = Number(req.params.permId);
  await RolePermission.destroy({ where: { role_id: roleId, permission_id: permId } });
  await auditRbacRolePermissionDetached(roleId, permId, req);
  res.status(204).send();
}
