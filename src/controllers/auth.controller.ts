/**
 * @file src/controllers/auth.controller.ts
 * @description Authentication controllers: register, login, logout, refresh, forgot/reset password, change password + audit.
 */

import { Request, Response } from "express";
import User from "@/models/User";
import { comparePassword, hashPassword, verifyPassword } from "@/utils/passwords";
import { issueAccessToken } from "@/utils/jwt";
import { getUserPermissionCodes, getUserRoleCodes } from "@/services/rbac.service";
import {
  issueRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens, // <- unified "revoke all" function
  exchangeRefreshToken,
} from "@/services/token.service";
import { createPasswordReset, consumePasswordResetToken } from "@/services/password-reset.service";
import { makeStampedCode } from "@/utils/codegen";
import { sendMail, buildResetUrl } from "@/services/mailer";
import { optionalEnv } from "@/config/env";
import { renderPasswordResetHtml, renderPasswordResetText } from "@/templates/email/password-reset.html";
import { withReq } from "@/lib/logger";
import {
  auditAuthLoginSucceeded,
  auditAuthLoginFailedUnknownEmail,
  auditAuthLoginFailedBadPassword,
  auditAuthPasswordResetRequested,
  auditAuthPasswordResetCompleted,
  auditAuthPasswordResetInvalidToken,
} from "@/services/audit.service";
import { changePasswordSchema } from "@/validation/auth.schema";
import sequelize from "@/config/db";

/** cookie helpers */
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = optionalEnv("API_BASE_PATH", "/api"); // must match API base path
const REFRESH_COOKIE_SECURE = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_SAMESITE: "lax" | "strict" | "none" = (process.env.COOKIE_SAMESITE as any) || "lax";

/** set httpOnly refresh cookie */
function setRefreshCookie(res: Response, token: string, expAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: REFRESH_COOKIE_SAMESITE,
    secure: REFRESH_COOKIE_SECURE,
    expires: expAt,
    path: REFRESH_COOKIE_PATH,
  });
}

/** clear refresh cookie */
function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
    httpOnly: true,
    sameSite: REFRESH_COOKIE_SAMESITE,
    secure: REFRESH_COOKIE_SECURE,
  });
}

/** POST /api/auth/register */
export async function register(req: Request, res: Response) {
  const log = withReq(req);
  const { email, password, first_name, last_name } = req.body as {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  };

  const exist = await User.findOne({ where: { email } });
  if (exist) return res.status(409).json({ message: "Email already registered" });

  const password_hash = await hashPassword(password);
  const user = await User.create({
    email,
    password_hash,
    first_name: first_name ?? null,
    last_name: last_name ?? null,
  });

  const account_code = makeStampedCode("acc", user.id);
  user.account_code = account_code;
  await user.save();

  const [roles, permissions] = await Promise.all([getUserRoleCodes(user.id), getUserPermissionCodes(user.id)]);

  const accessToken = issueAccessToken({ sub: user.id, email: user.email, roles, permissions });
  const { token: refreshToken, expAt } = await issueRefreshToken(user.id);

  setRefreshCookie(res, refreshToken, expAt);

  log.info({ userId: user.id, email: user.email }, "auth.register.success");
  return res.status(201).json({
    user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, account_code },
    accessToken,
    refreshExpAt: expAt.toISOString(),
  });
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response) {
  const log = withReq(req);
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ where: { email } });
  if (!user) {
    log.warn({ email }, "auth.login.failure.unknown_email");
    await auditAuthLoginFailedUnknownEmail(email, req);
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (user.is_active === false) {
    log.warn({ userId: user.id, email }, "auth.login.failure.disabled_user");
    return res.status(403).json({ message: "User disabled" });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    log.warn({ userId: user.id, email }, "auth.login.failure.bad_password");
    await auditAuthLoginFailedBadPassword(user.id, email, req);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  user.last_login_at = new Date();
  await user.save();

  const [roles, permissions] = await Promise.all([getUserRoleCodes(user.id), getUserPermissionCodes(user.id)]);
  const accessToken = issueAccessToken({ sub: user.id, email: user.email, roles, permissions });
  const { token: refreshToken, expAt } = await issueRefreshToken(user.id);

  setRefreshCookie(res, refreshToken, expAt);

  log.info({ userId: user.id, email }, "auth.login.success");
  await auditAuthLoginSucceeded(user.id, email, req);

  return res.json({ accessToken, refreshExpAt: expAt.toISOString() });
}

/** POST /api/auth/logout (body or cookie) */
export async function logout(req: Request, res: Response) {
  const log = withReq(req);
  const body = (req.body ?? {}) as { refreshToken?: string };
  const cookieToken = (req as any).cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  const refreshToken = body.refreshToken ?? cookieToken;

  if (!refreshToken) {
    clearRefreshCookie(res);
    log.info("auth.logout.no_token_but_cookie_cleared");
    return res.status(204).send();
  }

  await revokeRefreshToken(refreshToken);
  clearRefreshCookie(res);
  log.info("auth.logout.success");
  return res.status(204).send();
}

/** POST /api/auth/forgot-password */
export async function forgotPassword(req: Request, res: Response) {
  const log = withReq(req);
  const { email } = req.body as { email: string };
  const { issued, token, expAt, user } = await createPasswordReset(email);

  await auditAuthPasswordResetRequested(email, !!issued, req);
  log.info({ email, issued }, "auth.password.reset.requested");

  const response: any = { message: "If the email exists, a reset link has been sent." };
  if (issued && token && expAt && user) {
    const resetUrl = buildResetUrl(token);
    const ttlMin = Number(optionalEnv("PASSWORD_RESET_TTL_MIN", "60")) || 60;
    const subject = "Reinitialisation de votre mot de passe";
    const html = renderPasswordResetHtml({ resetUrl, minutes: ttlMin });
    const text = renderPasswordResetText({ resetUrl, minutes: ttlMin });

    try {
      await sendMail({ to: user.email, subject, html, text });
    } catch (e) {
      log.error({ err: e }, "auth.password.reset.mail_error");
    }

    if (process.env.NODE_ENV !== "production") {
      response.debug = { token, expAt: expAt.toISOString(), resetUrl };
    }
  }
  return res.json(response);
}

/** POST /api/auth/reset-password */
export async function resetPassword(req: Request, res: Response) {
  const log = withReq(req);
  const { token, password } = req.body as { token: string; password: string };

  const user = await consumePasswordResetToken(token);
  if (!user) {
    log.warn("auth.password.reset.invalid_token");
    await auditAuthPasswordResetInvalidToken(req);
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password_hash = await hashPassword(password);
  await user.save();
  await revokeAllUserRefreshTokens(user.id); // force re-login
  clearRefreshCookie(res); // <- adjustment: also clear cookie on reset

  log.info({ userId: user.id }, "auth.password.reset.completed");
  await auditAuthPasswordResetCompleted(user.id, req);

  return res.json({ message: "Password updated" });
}

/** POST /api/auth/refresh (body or cookie, rotates refresh) */
export async function refresh(req: Request, res: Response) {
  const log = withReq(req);

  const body = (req.body ?? {}) as { refreshToken?: string };
  const cookieToken = (req as any).cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  const incomingRefresh = body.refreshToken ?? cookieToken;

  if (!incomingRefresh) {
    log.warn("auth.refresh.missing_body_or_cookie");
    return res.status(400).json({ message: "Missing refreshToken" });
  }

  try {
    const exchanged = await exchangeRefreshToken(incomingRefresh);
    if (!exchanged) {
      log.warn("auth.refresh.failure.invalid");
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const { userId, token: newRefresh, expAt } = exchanged;

    const [roles, permissions, user] = await Promise.all([
      getUserRoleCodes(userId),
      getUserPermissionCodes(userId),
      User.findByPk(userId, { attributes: ["email"] }),
    ]);

    const accessToken = issueAccessToken({
      sub: userId,
      email: user?.email || "",
      roles,
      permissions,
    });

    setRefreshCookie(res, newRefresh, expAt);

    log.info({ userId }, "auth.refresh.success");
    return res.json({
      accessToken,
      refreshExpAt: expAt.toISOString(),
    });
  } catch (e: any) {
    log.error({ err: e }, "auth.refresh.unexpected_error");
    return res.status(500).json({ message: "Refresh failed" });
  }
}

/**
 * POST /api/auth/change-password
 * Requires authentication. Verifies current password and sets a new one.
 * Revokes all refresh tokens for the user and writes an audit row if action_logs exists.
 */
export async function changePassword(req: Request, res: Response) {
  const log = withReq(req);

  // 1) validate
  const { value, error } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    log.warn({ details: error.details }, "auth.change_password.validation_failed");
    return res.status(422).json({ message: error.message });
  }
  const { currentPassword, newPassword } = value as { currentPassword: string; newPassword: string };

  // 2) current user id (sub or id)
  const userId: number | undefined = (req as any).user?.sub ?? (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // 3) verify current password
  const ok = await comparePassword(currentPassword, user.password_hash);
  if (!ok) {
    log.warn({ userId }, "auth.change_password.bad_current");
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  // 4) disallow same password
  const same = await comparePassword(newPassword, user.password_hash);
  if (same) {
    return res.status(409).json({ message: "New password must be different from current password" });
  }

  // 5) hash & save
  user.password_hash = await hashPassword(newPassword);
  await user.save();

  // 6) revoke all refresh tokens (unified service)
  const revokedCount = await revokeAllUserRefreshTokens(user.id);
  clearRefreshCookie(res);

  // 7) audit row (best effort)
  try {
    const qi = sequelize.getQueryInterface();
    await qi.bulkInsert("action_logs", [
      {
        actor_user_id: user.id,
        action: "user.change_password",
        target_type: "user",
        target_id: user.id,
        ip: req.ip ?? null,
        user_agent: req.headers["user-agent"] ?? null,
        meta: JSON.stringify({ revoked_tokens: revokedCount }),
        created_at: new Date(),
      },
    ]);
  } catch {
    // silent if table does not exist
  }

  // 8) response
  return res.status(200).json({ message: "Password changed successfully. All refresh tokens revoked." });
}
