/**
 * @file src/routes/users.routes.ts
 * @description Users CRUD routes + role mapping. Protected by JWT; writes require users.* permissions.
 */
import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { requirePermission } from "@/middleware/rbac";
import {
  listUsers, createUser, getUser, updateUser, deleteUser,
  getUserRoles, putUserRoles
} from "@/controllers/users.controller";

// DB permission codes:
const PERM_USER_VIEW   = "users.view";
const PERM_USER_CREATE = "users.create";
const PERM_USER_UPDATE = "users.update";
const PERM_USER_DELETE = "users.delete";

const r = Router();

// read
r.get("/users", requireAuth, requirePermission(PERM_USER_VIEW), listUsers);
r.get("/users/:id", requireAuth, requirePermission(PERM_USER_VIEW), getUser);
r.get("/users/:id/roles", requireAuth, requirePermission(PERM_USER_VIEW), getUserRoles);

// write
r.post("/users", requireAuth, requirePermission(PERM_USER_CREATE), createUser);
r.put("/users/:id", requireAuth, requirePermission(PERM_USER_UPDATE), updateUser);
r.delete("/users/:id", requireAuth, requirePermission(PERM_USER_DELETE), deleteUser);
r.put("/users/:id/roles", requireAuth, requirePermission(PERM_USER_UPDATE), putUserRoles);

export default r;
