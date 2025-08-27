/**
 * @file src/middleware/errorHandler.ts
 * @description Gestion centralisée des erreurs Express (API JSON) :
 *  - AppError (erreurs métier)
 *  - JWT (jsonwebtoken)
 *  - Joi (validation)
 *  - Sequelize (unique/fk/validation)
 *  - Log via pino (reqId) + payload JSON propre
 */
import type { ErrorRequestHandler, Request } from 'express';
import { withReq } from '@/lib/logger';

const isProd = process.env.NODE_ENV === 'production';

/** Erreur métier contrôlée. */
export class AppError extends Error {
  public status: number;
  public code: string | undefined;
  public details?: unknown;
  constructor(message: string, status = 400, code?: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/* ================== Type guards utilitaires ================== */
function hasName(e: unknown, expected: string): boolean {
  return typeof e === 'object' && e !== null && 'name' in e && (e as any).name === expected;
}
function isError(e: unknown): e is Error {
  return e instanceof Error;
}
function isJoiError(e: unknown): e is { isJoi: true; message?: string; details?: Array<{ message?: string; path?: unknown }> } {
  return typeof e === 'object' && e !== null && 'isJoi' in e && (e as any).isJoi === true;
}
function pickSequelizeErrors(e: unknown): Array<{ message?: string; path?: string }> | undefined {
  const arr = (e as any)?.errors;
  return Array.isArray(arr) ? arr : undefined;
}
function pickFKInfo(e: unknown): { index?: string; fields?: string[] } | undefined {
  const idx = (e as any)?.index;
  const fields = (e as any)?.fields;
  if (!idx && !fields) return undefined;
  const result: { index?: string; fields?: string[] } = {};
  if (typeof idx === 'string') result.index = idx;
  if (Array.isArray(fields)) result.fields = fields;
  return result;
}

/** Normalise une erreur en { status, message, code, details }. */
function normalizeError(err: unknown) {
  // AppError
  if (err instanceof AppError) {
    return {
      status: err.status,
      message: err.message,
      code: err.code,
      details: err.details
    };
  }

  // JWT (jsonwebtoken)
  if (hasName(err, 'JsonWebTokenError')) {
    return { status: 401, message: 'Invalid token', code: 'auth.jwt.invalid', details: undefined };
  }
  if (hasName(err, 'TokenExpiredError')) {
    return { status: 401, message: 'Token expired', code: 'auth.jwt.expired', details: undefined };
  }

  // Joi (validation)
  if (isJoiError(err)) {
    const details = err.details?.map(d => ({ message: d.message ?? 'validation error', path: d.path })) ?? undefined;
    return { status: 422, message: err.message || 'Validation error', code: 'validation.failed', details };
  }

  // Sequelize (unique)
  if (hasName(err, 'SequelizeUniqueConstraintError')) {
    const details = pickSequelizeErrors(err)?.map(x => ({ path: x.path, message: x.message })) ?? undefined;
    return { status: 409, message: (err as any).message || 'Unique constraint violation', code: 'db.unique', details };
  }
  // Sequelize (FK)
  if (hasName(err, 'SequelizeForeignKeyConstraintError')) {
    const info = pickFKInfo(err);
    return { status: 409, message: (err as any).message || 'Foreign key constraint violation', code: 'db.foreign_key', details: info };
  }
  // Sequelize (validation)
  if (hasName(err, 'SequelizeValidationError')) {
    const details = pickSequelizeErrors(err)?.map(x => ({ path: x.path, message: x.message })) ?? undefined;
    return { status: 422, message: (err as any).message || 'Validation error', code: 'db.validation', details };
  }

  // Fallback générique
  return {
    status: 500,
    message: isError(err) && err.message ? err.message : 'Internal Server Error',
    code: undefined,
    details: undefined
  };
}

/** Middleware d'erreurs Express (fin de chaîne). */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const log = withReq(req);
  const norm = normalizeError(err);

  // Log structuré (inclut stack en dev)
  const payloadForLog: Record<string, unknown> = {
    status: norm.status,
    code: norm.code,
    msg: norm.message
  };
  if (!isProd && isError(err) && err.stack) payloadForLog.stack = err.stack;

  if (norm.status >= 500) log.error(payloadForLog, 'http.error');
  else if (norm.status >= 400) log.warn(payloadForLog, 'http.error');
  else log.info(payloadForLog, 'http.error');

  // Réponse JSON
  const body: Record<string, unknown> = { message: norm.message };
  if (norm.code) body.code = norm.code;
  if (norm.details !== undefined) body.details = norm.details;

  const reqId = (req as any)?.id || req.headers['x-request-id'];
  if (reqId) body.reqId = reqId;

  res.status(norm.status).json(body);
};
