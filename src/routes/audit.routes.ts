/**
 * @file src/routes/audit.routes.ts
 * @description Lecture des journaux d'audit (admin).
 */
import { Router } from 'express';
import ActionLog from '@/models/ActionLog';
import { requireAuth } from '@/middleware/requireAuth';
import { requirePermission } from '@/middleware/requirePermission';
import { PERM_RBAC_MANAGE } from '@/utils/rbac';

const r = Router();

r.get('/', requireAuth, requirePermission(PERM_RBAC_MANAGE), async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const rows = await ActionLog.findAll({ order: [['id', 'DESC']], limit });
  res.json(rows);
});

export default r;
