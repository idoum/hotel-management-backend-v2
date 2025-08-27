/**
 * @file src/controllers/auth.controller.ts
 * @description Contrôleurs d'authentification (login minimal).
 */

import { Request, Response } from 'express';
import User from '@/models/User';
import { verifyPassword } from '@/utils/passwords';
import { issueAccessToken } from '@/utils/jwt';

type LoginBody = { email: string; password: string };

/**
 * Authentifie un utilisateur par email/mot de passe.
 * Retourne un accessToken JWT si OK.
 */
export async function login(req: Request<{}, {}, LoginBody>, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (user.is_active === false) {
    return res.status(403).json({ message: 'User disabled' });
  }

  const token = issueAccessToken({
    sub: user.id,
    email: user.email,
    roles: [], // à peupler quand tu ajoutes RBAC
    permissions: []
  });

  return res.json({ accessToken: token });
}
