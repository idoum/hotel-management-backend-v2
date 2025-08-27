/**
 * @file src/routes/health.routes.ts
 * @description Routes de santé (healthcheck).
 */
import { Router } from 'express';
import { health } from '@/controllers/health.controller';

const r = Router();
/**
 * GET /api/health
 * Renvoie { status: 'ok', ts: ... }
 */
r.get('/', health);

export default r;
