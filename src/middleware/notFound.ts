/**
 * @file src/middleware/notFound.ts
 * @description Middleware 404: répond un JSON clair pour les routes inconnues.
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Retourne un 404 JSON avec méthode et chemin demandés.
 * @param req Requête entrante
 * @param res Réponse HTTP
 * @param _next Next (non utilisé)
 */
export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
}
