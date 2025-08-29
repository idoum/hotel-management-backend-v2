/**
 * @file src/utils/logger.ts
 * @description Logger Pino + helper withReq(req) "conscient" de la requête.
 * Compatible Pino v8+ (transport en 2ᵉ argument ou via opts.transport).
 */

import pino, { Logger } from 'pino';
import type { Request } from 'express';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const baseOptions: pino.LoggerOptions = {
  level,
  base: { service: 'hotel-management-backend-v2' },
};

// --- Création du logger ---
let logger: Logger;

if (!isProd) {
  // Variante A (recommandée) : utiliser pino.transport() et le passer en 2e argument
  const transport = pino.transport({
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  });
  logger = pino(baseOptions, transport);

  // Variante B (alternative) : sans pino.transport, via opts.transport (DE-COMMENTER si tu préfères)
  // logger = pino({
  //   ...baseOptions,
  //   transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
  // });
} else {
  logger = pino(baseOptions);
}

/**
 * @function reqIdFrom
 * @description Extrait un identifiant de requête si dispo.
 */
function reqIdFrom(req: Request): string | undefined {
  // pino-http ajoute parfois req.id ; sinon x-request-id
  return (req as any).id || (req.headers['x-request-id'] as string | undefined);
}

/**
 * @function withReq
 * @description Retourne un logger contextualisé pour la requête (req.log si dispo, sinon child global).
 */
export function withReq(req: Request): Logger {
  const reqLogger: Logger | undefined = (req as any).log;
  const base = reqLogger ?? logger;

  const id = reqIdFrom(req);
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress) as string | undefined;

  return base.child({
    ...(id ? { reqId: id } : {}),
    ...(ip ? { ip } : {}),
    method: req.method,
    url: req.originalUrl || req.url,
  });
}

/**
 * @function getLogger
 * @description Retourne le logger global (hors contexte req).
 */
export function getLogger(): Logger {
  return logger;
}

export default logger;
