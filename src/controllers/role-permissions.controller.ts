/**
 * @file src/controllers/role-permissions.controller.ts
 * @description Role -> Permission mapping endpoints (get/put) used by frontend.
 */
import { Request, Response } from "express";
import { getRolePermissions, replaceRolePermissions } from "@/services/rbac.service";

/** GET /api/roles/:roleId/permissions */
export async function getRolePerms(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const perms = await getRolePermissions(roleId);
  return res.json(perms);
}

/** PUT /api/roles/:roleId/permissions  Body: { permissionIds: number[] } */
export async function putRolePerms(req: Request, res: Response) {
  const roleId = Number(req.params.roleId);
  const body = (req.body ?? {}) as { permissionIds?: number[] };
  const updated = await replaceRolePermissions(roleId, body.permissionIds || []);
  return res.json(updated);
}
