/**
 * @file src/controllers/permissions.controller.ts
 * @description CRUD permissions.
 */
import { Request, Response } from 'express';
import Permission from '@/models/Permission';
import { permissionCode, toSystemCode } from '@/utils/rbac';

/**
 * Liste les permissions.
 */
export async function listPermissions(_req: Request, res: Response) {
  const perms = await Permission.findAll({ order: [['id','ASC']] });
  res.json(perms);
}

/**
 * Crée une permission (code généré si absent, possibilité via resource/action).
 */
export async function createPermission(req: Request, res: Response) {
  const { name, code, resource, action } = req.body as { name: string; code?: string; resource?: string; action?: string; };
  let finalCode = code ? toSystemCode(code) : undefined;
  if (!finalCode && resource && action) finalCode = permissionCode(resource, action);
  if (!finalCode) finalCode = toSystemCode(name, 'perm');
  const perm = await Permission.create({ name, code: finalCode });
  res.status(201).json(perm);
}
