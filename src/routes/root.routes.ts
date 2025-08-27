/**
 * @file src/routes/root.routes.ts
 * @description Routes publiques montées sur "/".
 */
import { Router } from 'express';
import { welcome } from '@/controllers/root.controller';

const r = Router();

/**
 * GET /
 * Retourne un message d'accueil.
 */
r.get('/', welcome);

export default r;
