/**
 * @file src/routes/rbac.routes.ts
 * @description RBAC routes aligned with frontend + legacy aliases. Protected with JWT; writes require rbac.manage.
 */
import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import {
  listRoles,
  createRole,
  listPermissions,
  createPermission,
  getRolePermissions,
  putRolePermissions,
  assignUserRole,
  revokeUserRole,
  attachPermissionToRole,
  detachPermissionFromRole,
} from "@/controllers/rbac.controller";

// DB permission code: rbac.manage
const PERM_RBAC_MANAGE = "rbac.manage";

const r = Router();

/**
 * Policy:
 *  - GETs require authentication (any authenticated user can read RBAC catalog).
 *  - Writes (POST/PUT/DELETE) require rbac.manage.
 */
const canRead = [requireAuth];
const canWrite = [requireAuth, requirePermission(PERM_RBAC_MANAGE)];

// --- Frontend-aligned endpoints (mounted under /api) ---
r.get("/roles", canRead, listRoles);
r.post("/roles", canWrite, createRole);

r.get("/permissions", canRead, listPermissions);
r.post("/permissions", canWrite, createPermission);

r.get("/roles/:roleId/permissions", canRead, getRolePermissions);
r.put("/roles/:roleId/permissions", canWrite, putRolePermissions);

// user <-> role
r.post("/users/:userId/roles", canWrite, assignUserRole);
r.delete("/users/:userId/roles/:roleId", canWrite, revokeUserRole);

// legacy fine-grained attach/detach (optional for compat)
r.post("/roles/:roleId/permissions", canWrite, attachPermissionToRole);
r.delete("/roles/:roleId/permissions/:permId", canWrite, detachPermissionFromRole);

// --- Legacy aliases under /rbac/*, for compatibility with previous frontends ---
r.get("/rbac/roles", canRead, listRoles);
r.post("/rbac/roles", canWrite, createRole);

r.get("/rbac/permissions", canRead, listPermissions);
r.post("/rbac/permissions", canWrite, createPermission);

r.get("/rbac/roles/:roleId/permissions", canRead, getRolePermissions);
r.put("/rbac/roles/:roleId/permissions", canWrite, putRolePermissions);

r.post("/rbac/users/:userId/roles", canWrite, assignUserRole);
r.delete("/rbac/users/:userId/roles/:roleId", canWrite, revokeUserRole);

r.post("/rbac/roles/:roleId/permissions", canWrite, attachPermissionToRole);
r.delete("/rbac/roles/:roleId/permissions/:permId", canWrite, detachPermissionFromRole);

export default r;
