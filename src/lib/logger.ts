/**
 * @file src/lib/logger.ts
 * @description Logger applicatif (pino) + helper pour corréler aux requêtes (reqId).
 */
import pino from 'pino';
import type { Request } from 'express';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? 'info';

const baseOptions = {
  level,
  base: { service: 'hotel-management-backend-v2' }
} as const;

// ✅ Pas de `transport: undefined` ici : on fait 2 branches
export const logger = isProd
  ? pino(baseOptions)
  : pino({
      ...baseOptions,
      // en dev, affichage lisible
      // (type cast évite les chipotages de types internes de pino)
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } as any
    });

/**
 * Retourne un logger enfant corrélé à la requête (reqId propagé par pino-http).
 */
export function withReq(req: Request) {
  const reqId = (req as any)?.id || req.headers['x-request-id'];
  return logger.child({ reqId });
}
