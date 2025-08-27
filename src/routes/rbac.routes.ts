/**
 * @file src/routes/rbac.routes.ts
 * @description Routes RBAC (rôles, permissions, assignations), protégées par perm.rbac.manage.
 */
import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { createRoleSchema, assignRoleSchema } from '@/validation/role.schema';
import { createPermissionSchema, attachPermissionSchema } from '@/validation/permission.schema';
import {
  listRoles, createRole, assignRole, revokeRole, attachPermission, detachPermission
} from '@/controllers/roles.controller';
import { listPermissions, createPermission } from '@/controllers/permissions.controller';
import { requireAuth } from '@/middleware/auth';
import { requirePermission } from '@/middleware/rbac';
import { PERM_RBAC_MANAGE } from '@/utils/rbac';

const r = Router();

/**
 * Protéger TOUTES les routes RBAC :
 *  - JWT obligatoire
 *  - permission "perm.rbac.manage" requise
 */
r.use(requireAuth, requirePermission(PERM_RBAC_MANAGE));

// Rôles
r.get('/roles', listRoles);
r.post('/roles', validate(createRoleSchema), createRole);
r.post('/users/:userId/roles', validate(assignRoleSchema), assignRole);
r.delete('/users/:userId/roles/:roleId', revokeRole);

// Rôle <-> permissions
r.post('/roles/:roleId/permissions', validate(attachPermissionSchema), attachPermission);
r.delete('/roles/:roleId/permissions/:permId', detachPermission);

// Permissions
r.get('/permissions', listPermissions);
r.post('/permissions', validate(createPermissionSchema), createPermission);

export default r;
