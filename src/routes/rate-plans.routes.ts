/**
 * @file src/routes/rate-plans.routes.ts
 * @description Routes Rate Plans (protégées RBAC rates.*).
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { permissionCode } from '@/utils/rbac';
import { listRatePlans, createRatePlan, updateRatePlan, deleteRatePlan, upsertPrices, setRestrictions } from '@/controllers/rate-plans.controller';

const PERM_VIEW   = permissionCode('rates', 'view');
const PERM_CREATE = permissionCode('rates', 'create');
const PERM_UPDATE = permissionCode('rates', 'update');
const PERM_DELETE = permissionCode('rates', 'delete');

const r = Router();

r.get('/', requireAuth, requirePermission(PERM_VIEW), listRatePlans);
r.post('/', requireAuth, requirePermission(PERM_CREATE), createRatePlan);
r.patch('/:id', requireAuth, requirePermission(PERM_UPDATE), updateRatePlan);
r.delete('/:id', requireAuth, requirePermission(PERM_DELETE), deleteRatePlan);

// Prix & restrictions (update=CREATE or UPDATE)
r.put('/:id/prices', requireAuth, requirePermission(PERM_UPDATE), upsertPrices);
r.put('/:id/restrictions', requireAuth, requirePermission(PERM_UPDATE), setRestrictions);

export default r;
