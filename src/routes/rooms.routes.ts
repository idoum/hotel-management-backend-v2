/**
 * @file src/routes/rooms.routes.ts
 * @description Routes Rooms (protégées par RBAC).
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { listRooms, createRoom, updateRoom, deleteRoom } from '@/controllers/rooms.controller';
import { PERM_ROOMS_VIEW, PERM_ROOMS_CREATE, PERM_ROOMS_UPDATE, PERM_ROOMS_DELETE } from '@/utils/rbac';

const r = Router();
r.get('/', requireAuth, requirePermission(PERM_ROOMS_VIEW), listRooms);
r.post('/', requireAuth, requirePermission(PERM_ROOMS_CREATE), createRoom);
r.patch('/:id', requireAuth, requirePermission(PERM_ROOMS_UPDATE), updateRoom);
r.delete('/:id', requireAuth, requirePermission(PERM_ROOMS_DELETE), deleteRoom);
export default r;
