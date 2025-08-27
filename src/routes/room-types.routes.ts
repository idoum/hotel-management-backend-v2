/**
 * @file src/routes/room-types.routes.ts
 * @description Routes Room Types (protégées par RBAC).
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { listRoomTypes, createRoomType, updateRoomType, deleteRoomType } from '@/controllers/room-types.controller';
import { PERM_ROOMTYPES_VIEW, PERM_ROOMTYPES_CREATE, PERM_ROOMTYPES_UPDATE, PERM_ROOMTYPES_DELETE } from '@/utils/rbac';

const r = Router();
r.get('/', requireAuth, requirePermission(PERM_ROOMTYPES_VIEW), listRoomTypes);
r.post('/', requireAuth, requirePermission(PERM_ROOMTYPES_CREATE), createRoomType);
r.patch('/:id', requireAuth, requirePermission(PERM_ROOMTYPES_UPDATE), updateRoomType);
r.delete('/:id', requireAuth, requirePermission(PERM_ROOMTYPES_DELETE), deleteRoomType);
export default r;
