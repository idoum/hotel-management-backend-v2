/**
 * @file src/controllers/health.controller.ts
 * @description Contrôleur de santé (statut de l'API).
 */
import { Request, Response } from 'express';

/**
 * Renvoie un statut simple pour monitoring (sans DB).
 * @param _req Requête
 * @param res Réponse
 */
export function health(_req: Request, res: Response) {
  res.json({ status: 'ok', ts: new Date().toISOString() });
}
