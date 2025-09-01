/**
 * @file src/controllers/roles.controller.ts
 * @description CRUD rôles + assignations user/role.
 */
import { Request, Response } from 'express';
import Role from '@/models/Role';
import { roleCode, toSystemCode } from '@/utils/rbac';
import { assignRoleToUser, revokeRoleFromUser, attachPermissionToRole, detachPermissionFromRole } from '@/services/rbac.service';

/**
 * Liste des rôles.
 */
export async function listRoles(_req: Request, res: Response) {
  const roles = await Role.findAll({ order: [['id','ASC']] });
  res.json(roles);
}

/**
 * Crée un rôle (code généré si absent).
 */
export async function createRole(req: Request, res: Response) {
  const { name, code } = req.body as { name: string; code?: string };
  const finalCode = code ? toSystemCode(code) : roleCode(name);
  const role = await Role.create({ name, code: finalCode });
  res.status(201).json(role);
}

/**
 * Assigne un rôle à un user.
 */
export async function assignRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const { role_id } = req.body as { role_id: number };
  await assignRoleToUser(userId, role_id);
  res.status(204).send();
}

/**
 * Révoque un rôle d'un user.
 */
export async function revokeRole(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const roleId = Number(req.params.roleId);
  await revokeRoleFromUser(userId, roleId);
  res.status(204).send();
}

/**
 * Attache une permission à un rôle.
 */
export async function attachPermission(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const { permission_id } = req.body as { permission_id: number };
  await attachPermissionToRole(roleId, permission_id);
  res.status(204).send();
}

/**
 * Détache une permission d'un rôle.
 */
export async function detachPermission(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const permId = Number(req.params.permId);
  await detachPermissionFromRole(roleId, permId);
  res.status(204).send();
}
