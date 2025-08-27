/**
 * @file src/middleware/requireAuth.ts
 * @description Middleware qui exige un JWT Bearer valide et attache le payload à req.user.
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import type { JwtPayload } from 'jsonwebtoken';
import type { AccessPayload } from '@/utils/jwt';

/**
 * Exige un header Authorization: Bearer <token>.
 * Vérifie le JWT et attache le payload à req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = verifyAccessToken(token) as AccessPayload & JwtPayload;
    (req as any).user = payload; // (voir l’augmentation de type plus bas)
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
