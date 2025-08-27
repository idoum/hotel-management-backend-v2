/**
 * @file src/loaders/routes.ts
 * @description Routeur principal: monte les sous-routeurs de l'API.
 */

import { Router } from 'express';
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
