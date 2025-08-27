/**
 * @file src/middleware/httpLogger.ts
 * @description Logger HTTP (pino-http) avec request-id, durée et niveaux adaptés.
 */
import pinoHttp from 'pino-http';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const header = (req.headers['x-request-id'] as string) || nanoid();
    res.setHeader('x-request-id', header);
    return header;
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: (req.socket && (req.socket as any).remoteAddress) || undefined
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});
