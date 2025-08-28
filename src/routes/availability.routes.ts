/**
 * @file src/routes/availability.routes.ts
 * @description Routes de disponibilité.
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { permissionCode } from '@/utils/rbac';
import { searchAvailability } from '@/controllers/availability.controller';

const PERM_VIEW = permissionCode('reservations', 'view');

const r = Router();
r.get('/search', requireAuth, requirePermission(PERM_VIEW), searchAvailability);
export default r;
