/**
 * @file src/controllers/me.controller.ts
 * @description Endpoint profil: retourne l'utilisateur courant + roles + permissions.
 */
import { Request, Response } from 'express';
import User from '@/models/User';
import { getUserPermissionCodes, getUserRoleCodes } from '@/services/rbac.service';

/**
 * GET /api/me
 * Retourne le profil de l'utilisateur courant, avec ses rôles et permissions (calculés depuis la DB).
 * @param req Request (doit contenir req.user via requireAuth)
 * @param res Response
 */
export async function getMe(req: Request, res: Response) {
  const uid = req.user?.id;
  if (!uid) return res.status(401).json({ message: 'Unauthorized' });

  const user = await User.findByPk(uid, {
    attributes: ['id', 'email', 'first_name', 'last_name', 'is_active', 'created_at', 'updated_at']
  });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const [roles, permissions] = await Promise.all([
    getUserRoleCodes(uid),
    getUserPermissionCodes(uid)
  ]);

  return res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active,
    roles,
    permissions
  });
}
