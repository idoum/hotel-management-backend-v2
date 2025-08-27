/**
 * @file src/middleware/auth.ts
 * @description Middleware d'authentification via JWT (Authorization: Bearer).
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';

/**
 * Vérifie le JWT d'accès et peuple req.user si valide.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Missing Bearer token' });
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub as number,
      email: payload.email as string,
      roles: (payload.roles as string[]) ?? [],
      permissions: (payload.permissions as string[]) ?? []
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
