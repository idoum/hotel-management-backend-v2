/**
 * @file src/utils/jwt.ts
 * @description Helpers JWT (jsonwebtoken v9) avec imports de type.
 */
import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import { requiredEnv } from '@/config/env';

const ACCESS_SECRET = requiredEnv('JWT_ACCESS_SECRET');

/**
 * On dérive le type attendu pour expiresIn directement de jsonwebtoken,
 * ce qui évite toute divergence de types.
 */
type ExpiresLike = NonNullable<SignOptions['expiresIn']>;

// Valeur brute d'environnement (ex: "15m" ou "900")
const ACCESS_EXPIRES_RAW = process.env.ACCESS_EXPIRES;

/**
 * Normalise en string (style "15m", "2h", "7d") ou number (secondes).
 * Par défaut: "15m".
 */
const ACCESS_EXPIRES: ExpiresLike =
  ACCESS_EXPIRES_RAW === undefined
    ? '15m'
    : /^\d+$/.test(ACCESS_EXPIRES_RAW)
      ? Number(ACCESS_EXPIRES_RAW)
      : ACCESS_EXPIRES_RAW as ExpiresLike;

const signOpts: SignOptions = {
  expiresIn: ACCESS_EXPIRES
};

export type AccessPayload = {
  sub: number;
  email: string;
  roles?: string[];
  permissions?: string[];
};

/**
 * Émet un JWT d'accès.
 * @param payload Données minimales sur l'utilisateur
 */
export function issueAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, signOpts);
}

/**
 * Vérifie un JWT d'accès et retourne le payload.
 * @param token JWT
 */
export function verifyAccessToken(token: string): AccessPayload & JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload & JwtPayload;
}
