/**
 * @file src/services/password-reset.service.ts
 * @description Mot de passe perdu / reset : génération et validation de tokens.
 */
import crypto from 'crypto';
import { Op } from 'sequelize';
import { optionalEnv } from '@/config/env';
import PasswordReset from '@/models/PasswordReset';
import User from '@/models/User';

function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Crée une demande de reset pour un email (si l'utilisateur existe).
 * Stocke le hash + expiration, retourne le token en clair pour envoi (mail).
 * @param email Email utilisateur
 */
export async function createPasswordReset(email: string): Promise<{ issued: boolean; token?: string; expAt?: Date; user?: User | null }> {
  const user = await User.findOne({ where: { email } });
  if (!user) return { issued: false, user: null };

  const minutes = Number(optionalEnv('PASSWORD_RESET_TTL_MIN', '60')) || 60;
  const expAt = new Date(Date.now() + minutes * 60 * 1000);

  const token = generateOpaqueToken();
  const tokenHash = sha256(token);

  await PasswordReset.create({
    user_id: user.id,
    token_hash: tokenHash,
    exp_at: expAt
  });

  return { issued: true, token, expAt, user };
}

/**
 * Consomme un token de reset : vérifie hash/expiry/not used, puis renvoie l'utilisateur.
 * @param token Token en clair fourni par l'utilisateur
 */
export async function consumePasswordResetToken(token: string): Promise<User | null> {
  const tokenHash = sha256(token);
  const now = new Date();

  const pr = await PasswordReset.findOne({
    where: {
      token_hash: tokenHash,
      used_at: { [Op.is]: null },
      exp_at: { [Op.gt]: now }
    }
  });

  if (!pr) return null;

  const user = await User.findByPk(pr.user_id);
  if (!user) return null;

  // marque comme utilisé
  pr.used_at = new Date();
  await pr.save();

  return user;
}
