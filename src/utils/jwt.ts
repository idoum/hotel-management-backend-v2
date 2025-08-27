import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { requiredEnv } from '@/config/env';

const ACCESS_SECRET = requiredEnv('JWT_ACCESS_SECRET');

// Déduire le type du 3e paramètre de jwt.sign
type SignOptsFromFn = Parameters<typeof jwt.sign>[2];
const signOpts: SignOptsFromFn = {
  expiresIn: (process.env.ACCESS_EXPIRES as string | undefined) ?? '15m'
};

export type AccessPayload = {
  sub: number;
  email: string;
  roles?: string[];
  permissions?: string[];
};

export function issueAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, signOpts);
}

export function verifyAccessToken(token: string): AccessPayload & JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload & JwtPayload;
}
