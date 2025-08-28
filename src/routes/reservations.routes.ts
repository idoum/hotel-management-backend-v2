/**
 * @file src/routes/reservations.routes.ts
 * @description CRUD Réservations.
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { permissionCode } from '@/utils/rbac';
import { listReservations, getReservation, createReservation, updateReservation, deleteReservation } from '@/controllers/reservations.controller';

const PERM_VIEW   = permissionCode('reservations', 'view');
const PERM_CREATE = permissionCode('reservations', 'create');
const PERM_UPDATE = permissionCode('reservations', 'update');
const PERM_DELETE = permissionCode('reservations', 'delete');

const r = Router();
r.get('/', requireAuth, requirePermission(PERM_VIEW), listReservations);
r.get('/:id', requireAuth, requirePermission(PERM_VIEW), getReservation);
r.post('/', requireAuth, requirePermission(PERM_CREATE), createReservation);
r.patch('/:id', requireAuth, requirePermission(PERM_UPDATE), updateReservation);
r.delete('/:id', requireAuth, requirePermission(PERM_DELETE), deleteReservation);

export default r;
