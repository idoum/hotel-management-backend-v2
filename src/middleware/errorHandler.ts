/**
 * @file src/middleware/errorHandler.ts
 * @description Gestion centralisée des erreurs Express.
 */

import { Request, Response, NextFunction } from 'express';

export interface HttpError extends Error {
  status?: number;
}

/**
 * Middleware Express de gestion des erreurs.
 * @param err Erreur
 * @param _req Requête
 * @param res Réponse
 * @param _next Next
 */
export function errorHandler(err: HttpError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';
  if (status >= 500) {
    console.error('Unhandled error:', err);
  }
  res.status(status).json({ message });
}
