/**
 * @file src/middleware/rbac.ts
 * @description Middleware "requirePermission" pour protéger une route par code permission.
 */
import { Request, Response, NextFunction } from 'express';
import { getUserPermissionCodes } from '@/services/rbac.service';

/**
 * Exige qu'un utilisateur authentifié possède la permission demandée.
 * @param permCode Code permission (ex: "perm.reservations.view")
 */
export function requirePermission(permCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    // 1) D'abord, si le token contient déjà la permission (optimisation)
    const tokenPerms = req.user.permissions || [];
    if (tokenPerms.includes(permCode)) return next();

    // 2) Sinon, re-calcul DB (sécurité en profondeur)
    const dbPerms = await getUserPermissionCodes(req.user.id);
    if (dbPerms.includes(permCode)) return next();

    return res.status(403).json({ message: 'Forbidden: missing permission', code: permCode });
  };
}
