/**
 * @file src/routes/roles.routes.ts
 * @description Roles routes: CRUD, user<->role assign, role<->permission mapping.
 */
import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import {
  listRoles, createRole, assignRole, revokeRole,
  attachPermission, detachPermission
} from "@/controllers/roles.controller";
import { getRolePerms, putRolePerms } from "@/controllers/role-permissions.controller";

// RBAC manage permission (must match your DB)
const PERM_RBAC_MANAGE = "perm.rbac.manage";

const r = Router();

// Read roles for any authenticated user (optional: restrict as you like)
r.get("/roles", requireAuth, listRoles);

// Writes require manage permission
r.post("/roles", requireAuth, requirePermission(PERM_RBAC_MANAGE), createRole);

// User <-> Role
r.post("/users/:userId/roles", requireAuth, requirePermission(PERM_RBAC_MANAGE), assignRole);
r.delete("/users/:userId/roles/:roleId", requireAuth, requirePermission(PERM_RBAC_MANAGE), revokeRole);

// Role <-> Permission (fine grained)
r.post("/roles/:roleId/permissions", requireAuth, requirePermission(PERM_RBAC_MANAGE), attachPermission);
r.delete("/roles/:roleId/permissions/:permId", requireAuth, requirePermission(PERM_RBAC_MANAGE), detachPermission);

// Role <-> Permission (frontend mapping: GET/PUT)
r.get("/roles/:roleId/permissions", requireAuth, getRolePerms);
r.put("/roles/:roleId/permissions", requireAuth, requirePermission(PERM_RBAC_MANAGE), putRolePerms);

export default r;
