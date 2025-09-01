/**
 * @file src/controllers/users.controller.ts
 * @description Users CRUD and role mapping (get/put roles).
 */
import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "@/models/User";
import Role from "@/models/Role";
import UserRole from "@/models/UserRole";
import { hashPassword } from "@/utils/passwords";

/** buildWhere:
 * @description builds where clause for search and filters (q, active).
 */
function buildWhere(q?: string, active?: string) {
  const where: any = {};
  if (typeof active !== "undefined") {
    if (active === "true") where.is_active = true;
    else if (active === "false") where.is_active = false;
  }
  if (q && q.trim()) {
    const s = q.trim();
    where[Op.or] = [
      { email: { [Op.like]: `%${s}%` } },
      { first_name: { [Op.like]: `%${s}%` } },
      { last_name: { [Op.like]: `%${s}%` } }
    ];
  }
  return where;
}

/** GET /api/users
 * Query: q, active=true|false, page=1, pageSize=20
 */
export async function listUsers(req: Request, res: Response) {
  const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || "20"), 10) || 20, 1), 200);
  const q = String(req.query.q || "");
  const active = typeof req.query.active !== "undefined" ? String(req.query.active) : undefined;

  const where = buildWhere(q, active);
  const { rows, count } = await User.findAndCountAll({
    where,
    order: [["id", "ASC"]],
    offset: (page - 1) * pageSize,
    limit: pageSize,
    attributes: ["id", "email", "first_name", "last_name", "is_active", "created_at", "updated_at"]
  });

  return res.json({ data: rows, page, pageSize, total: count });
}

/** POST /api/users
 * Body: { email, first_name?, last_name?, is_active?, password? }
 */
export async function createUser(req: Request, res: Response) {
  const body = (req.body ?? {}) as {
    email: string; first_name?: string; last_name?: string; is_active?: boolean; password?: string;
  };
  if (!body.email) return res.status(422).json({ message: "email is required" });

  const exist = await User.findOne({ where: { email: body.email } });
  if (exist) return res.status(409).json({ message: "email already exists" });

  let password_hash: string | null = null;
  if (body.password && body.password.length >= 6) {
    password_hash = await hashPassword(body.password);
  }

  const user = await User.create({
    email: body.email,
    first_name: body.first_name ?? null,
    last_name: body.last_name ?? null,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    password_hash: password_hash ?? ""
  });

  return res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active
  });
}

/** GET /api/users/:id */
export async function getUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await User.findByPk(id, {
    attributes: ["id", "email", "first_name", "last_name", "is_active", "created_at", "updated_at"]
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
}

/** PUT /api/users/:id
 * Body: { first_name?, last_name?, is_active? }
 * (email and password not updated here)
 */
export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const body = (req.body ?? {}) as { first_name?: string; last_name?: string; is_active?: boolean };

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (typeof body.first_name !== "undefined") user.first_name = body.first_name;
  if (typeof body.last_name !== "undefined") user.last_name = body.last_name;
  if (typeof body.is_active !== "undefined") user.is_active = !!body.is_active;

  await user.save();
  return res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active
  });
}

/** DELETE /api/users/:id
 * Soft delete by default (set is_active=false). Hard delete with ?hard=true.
 */
export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const hard = String(req.query.hard || "false") === "true";

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (hard) {
    await user.destroy();
    return res.status(204).send();
  } else {
    user.is_active = false;
    await user.save();
    return res.status(200).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active
    });
  }
}

/** GET /api/users/:id/roles */
export async function getUserRoles(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await User.findByPk(id, {
    attributes: ["id"],
    include: [{
      association: User.associations.roles!,
      attributes: ["id", "code", "name"],
      through: { attributes: [] },
      required: false
    }]
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  const roles = (user as any).roles as Role[] | undefined || [];
  return res.json(roles);
}

/** PUT /api/users/:id/roles
 * Body: { roleIds: number[] } -> replace mapping (idempotent)
 */
export async function putUserRoles(req: Request, res: Response) {
  const id = Number(req.params.id);
  const roleIds = Array.isArray((req.body ?? {}).roleIds) ? (req.body as any).roleIds as number[] : [];

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const clean = Array.from(new Set(roleIds.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0)));

  const existing = await UserRole.findAll({
    where: { user_id: id },
    attributes: ["role_id"]
  });
  const current = new Set(existing.map((ur) => ur.get("role_id") as number));
  const next = new Set(clean);

  const toAdd: number[] = [];
  const toRemove: number[] = [];
  next.forEach((rid) => { if (!current.has(rid)) toAdd.push(rid); });
  current.forEach((rid) => { if (!next.has(rid)) toRemove.push(rid); });

  if (toAdd.length) {
    await UserRole.bulkCreate(toAdd.map((rid) => ({ user_id: id, role_id: rid })), { ignoreDuplicates: true });
  }
  if (toRemove.length) {
    await UserRole.destroy({ where: { user_id: id, role_id: toRemove } as any });
  }

  // return updated roles
  const updatedUser = await User.findByPk(id, {
    attributes: ["id"],
    include: [{
      association: User.associations.roles!,
      attributes: ["id", "code", "name"],
      through: { attributes: [] },
      required: false
    }]
  });
  const roles = (updatedUser as any)?.roles ?? [];
  return res.json(roles);
}
