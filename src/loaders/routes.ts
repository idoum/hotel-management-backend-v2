/**
 * @file src/loaders/routes.ts
 * @description Routeur principal "/api".
 */
import { Router } from 'express';
import healthRoutes from '@/routes/health.routes';
import meRoutes from '@/routes/me.routes';
import authRoutes from '@/routes/auth.routes';
import rbacRoutes from '@/routes/rbac.routes';
import docsRoutes from '@/routes/docs.routes';
import roomTypesRoutes from '@/routes/room-types.routes';
import roomsRoutes from '@/routes/rooms.routes';

const router = Router();

function buildRouter() {
  router.use('/health', healthRoutes);
  router.use('/me', meRoutes);
  router.use('/auth', authRoutes);
  router.use('/rbac', rbacRoutes);
  router.use('/room-types', roomTypesRoutes);
  router.use('/rooms', roomsRoutes);
  router.use('/docs', docsRoutes);
  return router;
}

export default buildRouter();
