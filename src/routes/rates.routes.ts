/**
 * @file src/routes/rates.routes.ts
 * @description Routes de quotation (lecture seule).
 */
import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { permissionCode } from '@/utils/rbac';
import { quoteRates } from '@/controllers/rates.controller';

const PERM_VIEW = permissionCode('rates', 'view');

const r = Router();
r.get('/quote', requireAuth, requirePermission(PERM_VIEW), quoteRates);
export default r;
