/**
 * @file src/controllers/root.controller.ts
 * @description Contr√¥leur pour la racine "/".
 */
import { Request, Response } from 'express';

/**
 * GET /
 * Message d'accueil + endpoints utiles.
 */
export function welcome(_req: Request, res: Response) {
  res.json({
    app: 'hotel-management-backend-v2',
    message: 'Bienvenue Ì±ã',
    try: ['/api/health', '/api/me']
  });
}
