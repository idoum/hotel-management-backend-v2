/**
 * @file src/services/token.service.ts
 * @description Gestion des refresh tokens : création, révocation, échange (rotation).
 */
import crypto from 'crypto';
import { Op, Transaction } from 'sequelize';
import sequelize from '@/config/db';
import RefreshToken from '@/models/RefreshToken';
import { optionalEnv } from '@/config/env';

/** Génère un token opaque sécurisé (base64url). */
function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Hash SHA256 d'un token pour stockage. */
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** Crée et stocke un refresh token (hashé), et retourne le token en clair. */
export async function issueRefreshToken(userId: number, t?: Transaction): Promise<{ token: string; expAt: Date }> {
  const days = Number(optionalEnv('REFRESH_TTL_DAYS', '30')) || 30;
  const expAt = new Date(Date.now() + days * 86400 * 1000);
  const token = generateOpaqueToken();
  const tokenHash = sha256(token);

  await RefreshToken.create(
    { user_id: userId, token_hash: tokenHash, exp_at: expAt },
    { transaction: t ?? null }
  );

  return { token, expAt };
}

/** Révoque un refresh token (si trouvé). */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = sha256(token);
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { token_hash: tokenHash, revoked_at: { [Op.is]: null } } }
  );
}

/** Révoque tous les refresh tokens actifs de l'utilisateur (ex: après reset). */
export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, revoked_at: { [Op.is]: null } } }
  );
}

/**
 * Échange un refresh token valide contre un NOUVEAU refresh token (rotation) et retourne l'userId.
 * - Vérifie non-révoqué et non-expiré
 * - Révoque l'ancien
 * - Émet un nouveau
 */
export async function exchangeRefreshToken(oldToken: string): Promise<{ userId: number; token: string; expAt: Date } | null> {
  const tokenHash = sha256(oldToken);
  const now = new Date();

  return sequelize.transaction(async (t) => {
    const row = await RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        revoked_at: { [Op.is]: null },
        exp_at: { [Op.gt]: now }
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!row) return null;

    // Révoque l'ancien token
    row.revoked_at = new Date();
    await row.save({ transaction: t });

    // Émet un nouveau
    const { token, expAt } = await issueRefreshToken(row.user_id, t);
    return { userId: row.user_id, token, expAt };
  });
}
