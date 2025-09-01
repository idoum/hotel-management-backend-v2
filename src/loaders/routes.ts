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
import ratePlansRoutes from '@/routes/rate-plans.routes';
import ratesRoutes from '@/routes/rates.routes';
import availabilityRoutes from '@/routes/availability.routes';
import reservationsRoutes from '@/routes/reservations.routes';
import usersRoutes from '@/routes/users.routes';
 
const router = Router();

function buildRouter() {
  router.use('/health', healthRoutes);
  router.use('/me', meRoutes);
  router.use('/auth', authRoutes);
  router.use('/rbac', rbacRoutes);
  router.use('/room-types', roomTypesRoutes);
  router.use('/rooms', roomsRoutes);
  router.use('/docs', docsRoutes);
  router.use('/rate-plans', ratePlansRoutes);
  router.use('/rates', ratesRoutes);
  router.use('/availability', availabilityRoutes);
  router.use('/reservations', reservationsRoutes);
  router.use('/users', usersRoutes);

  return router;
}

export default buildRouter();
