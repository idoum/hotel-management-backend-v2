/**
 * @file src/loaders/routes.ts
 * @description Routeur principal "/api" : monte toutes les sous-routes.
 */
import { Router } from 'express';
import healthRoutes from '@/routes/health.routes';
import rbacRoutes from '@/routes/rbac.routes';
import meRoutes from '@/routes/me.routes';
import authRoutes from '@/routes/auth.routes';
import docsRoutes from '@/routes/docs.routes';
import auditRoutes from '@/routes/audit.routes';

const router = Router();

function buildRouter() {
  router.use('/health', healthRoutes);
  router.use('/me', meRoutes);
  router.use('/auth', authRoutes);
  router.use('/rbac', rbacRoutes);
  router.use('/docs', docsRoutes); // UI + JSON
  router.use('/audit', auditRoutes);
  
  return router;
}

export default buildRouter();
