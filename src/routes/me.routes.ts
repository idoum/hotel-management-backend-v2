/**
 * @file src/routes/me.routes.ts
 * @description Routeur "profil courant": GET /api/me
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { getMe } from '@/controllers/me.controller';

const r = Router();

/**
 * GET /api/me
 * Protégé par JWT; retourne l'utilisateur courant + rôles + permissions.
 */
r.get('/', requireAuth, getMe);

export default r;
