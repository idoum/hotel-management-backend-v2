/**
 * @file src/middleware/requirePermission.ts
 * @description Middleware RBAC: vérifie qu'un utilisateur authentifié possède la permission requise.
 */
import type { Request, Response, NextFunction } from 'express';
import type { AccessPayload } from '@/utils/jwt';
import { getUserPermissionCodes } from '@/services/rbac.service';

/**
 * Vérifie qu'au moins une permission requise est présente.
 * @param needed code (ex: "perm.rbac.manage") ou liste de codes
 */
export function requirePermission(needed: string | string[]) {
  const required = Array.isArray(needed) ? needed : [needed];

  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as (AccessPayload | undefined);
    if (!user?.sub) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1) on regarde d'abord le JWT (rapide)
    const fromJwt = new Set(user.permissions || []);
    const hasFromJwt = required.some(code => fromJwt.has(code));
    if (hasFromJwt) return next();

    // 2) sinon on recharge depuis la base (permissions fraîches)
    try {
      const fresh = await getUserPermissionCodes(Number(user.sub));
      const hasFresh = required.some(code => fresh.includes(code));
      if (hasFresh) return next();
    } catch (e) {
      // ignore: on tombera en 403
    }

    return res.status(403).json({ message: 'Forbidden' });
  };
}
