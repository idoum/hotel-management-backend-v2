/**
 * @file src/services/audit.service.ts
 * @description Écriture de journaux d'audit (RBAC & Auth) dans action_logs.
 */
import ActionLog from '@/models/ActionLog';
import type { Request } from 'express';

function getActorUserId(req?: Request): number | null {
  const anyReq = req as any;
  const sub = anyReq?.user?.sub ?? anyReq?.auth?.sub;
  if (typeof sub === 'number') return sub;
  if (typeof sub === 'string' && /^\d+$/.test(sub)) return Number(sub);
  return null;
}

/**
 * Journalise une action générique.
 */
export async function auditLog(params: {
  action: string;
  targetType?: string | null | undefined;
  targetId?: number | null | undefined;
  meta?: any | null;
  req?: Request | undefined;
  actorUserId?: number | null | undefined;
}) {
  const { action, targetType = null, targetId = null, meta = null, req, actorUserId } = params;

  const actor = actorUserId ?? getActorUserId(req);
  const ip = req?.headers['x-forwarded-for']?.toString() ||
             (req?.socket as any)?.remoteAddress ||
             null;
  const ua = (req?.headers['user-agent'] as string) || null;

  await ActionLog.create({
    actor_user_id: actor,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    ip: ip ? String(ip).substring(0, 64) : null,
    user_agent: ua ? ua.substring(0, 255) : null,
    meta: meta ?? null
  });
}

/* ====== RBAC (déjà existants si tu les avais ajoutés) ====== */
export async function auditRbacRoleCreated(roleId: number, meta: any, req?: Request) {
  await auditLog({ action: 'rbac.role.created', targetType: 'Role', targetId: roleId, meta, req });
}
export async function auditRbacPermissionCreated(permId: number, meta: any, req?: Request) {
  await auditLog({ action: 'rbac.permission.created', targetType: 'Permission', targetId: permId, meta, req });
}
export async function auditRbacUserRoleAssigned(userId: number, roleId: number, req?: Request) {
  await auditLog({ action: 'rbac.user.role.assigned', targetType: 'UserRole', targetId: userId, meta: { roleId }, req });
}
export async function auditRbacUserRoleRevoked(userId: number, roleId: number, req?: Request) {
  await auditLog({ action: 'rbac.user.role.revoked', targetType: 'UserRole', targetId: userId, meta: { roleId }, req });
}
export async function auditRbacRolePermissionAttached(roleId: number, permId: number, req?: Request) {
  await auditLog({ action: 'rbac.role.permission.attached', targetType: 'RolePermission', targetId: roleId, meta: { permId }, req });
}
export async function auditRbacRolePermissionDetached(roleId: number, permId: number, req?: Request) {
  await auditLog({ action: 'rbac.role.permission.detached', targetType: 'RolePermission', targetId: roleId, meta: { permId }, req });
}

/* ====== AUTH (nouveau) ====== */

/** Login réussi */
export async function auditAuthLoginSucceeded(userId: number, email: string, req?: Request) {
  await auditLog({
    action: 'auth.login.success',
    targetType: 'User',
    targetId: userId,
    meta: { email },
    req,
    actorUserId: userId
  });
}

/** Login échoué : user inconnu */
export async function auditAuthLoginFailedUnknownEmail(email: string, req?: Request) {
  await auditLog({
    action: 'auth.login.failure',
    targetType: 'User',
    targetId: null,
    meta: { reason: 'unknown_email', email },
    req
  });
}

/** Login échoué : mauvais mot de passe */
export async function auditAuthLoginFailedBadPassword(userId: number, email: string, req?: Request) {
  await auditLog({
    action: 'auth.login.failure',
    targetType: 'User',
    targetId: userId,
    meta: { reason: 'bad_password', email },
    req
  });
}

/** Demande de reset (token émis ou pas) */
export async function auditAuthPasswordResetRequested(email: string, issued: boolean, req?: Request) {
  await auditLog({
    action: 'auth.password.reset.requested',
    targetType: 'User',
    targetId: null,
    meta: { email, issued },
    req
  });
}

/** Reset accompli (mot de passe changé) */
export async function auditAuthPasswordResetCompleted(userId: number, req?: Request) {
  await auditLog({
    action: 'auth.password.reset.completed',
    targetType: 'User',
    targetId: userId,
    meta: null,
    req,
    actorUserId: userId
  });
}

/** Token de reset invalide/expiré */
export async function auditAuthPasswordResetInvalidToken(req?: Request) {
  await auditLog({
    action: 'auth.password.reset.invalid_token',
    targetType: 'PasswordReset',
    targetId: null,
    meta: null,
    req
  });
}
