/**
 * @file src/services/auth.service.ts
 * @description Services d'authentification (création/échange de refresh tokens, révocation, ...).
 */

import RefreshToken from '@/models/RefreshToken';

// … tes autres exports (createRefreshToken, exchangeRefreshToken, etc.)

/**
 * @function revokeAllRefreshTokens
 * @description Marque tous les refresh tokens de l'utilisateur comme révoqués (revoked_at = NOW()).
 * @param userId ID de l'utilisateur
 * @returns Promise<number> nombre de tokens affectés
 */
export async function revokeAllRefreshTokens(userId: number): Promise<number> {
  const [count] = await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { user_id: userId, revoked_at: null } }
  );
  return count;
}
