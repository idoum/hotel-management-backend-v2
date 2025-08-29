/**
 * @file src/controllers/auth.controller.ts
 * @description Authentification: register, login, logout, forgot, reset, refresh + logs/audit.
 */
import { Request, Response } from 'express';
import User from '@/models/User';
import { hashPassword, verifyPassword } from '@/utils/passwords';
import { issueAccessToken } from '@/utils/jwt';
import { getUserPermissionCodes, getUserRoleCodes } from '@/services/rbac.service';
import { issueRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens, exchangeRefreshToken } from '@/services/token.service';
import { createPasswordReset, consumePasswordResetToken } from '@/services/password-reset.service';
import { makeStampedCode } from '@/utils/codegen';
import { sendMail, buildResetUrl } from '@/services/mailer';
import { optionalEnv } from '@/config/env';
import { renderPasswordResetHtml, renderPasswordResetText } from '@/templates/email/password-reset.html';
import { withReq } from '@/lib/logger';
import {
  auditAuthLoginSucceeded,
  auditAuthLoginFailedUnknownEmail,
  auditAuthLoginFailedBadPassword,
  auditAuthPasswordResetRequested,
  auditAuthPasswordResetCompleted,
  auditAuthPasswordResetInvalidToken
} from '@/services/audit.service';

/** Inscription */
export async function register(req: Request, res: Response) {
  const log = withReq(req);
  const { email, password, first_name, last_name } = req.body as {
    email: string; password: string; first_name?: string; last_name?: string;
  };

  const exist = await User.findOne({ where: { email } });
  if (exist) return res.status(409).json({ message: 'Email already registered' });

  const password_hash = await hashPassword(password);
  const user = await User.create({
    email,
    password_hash,
    first_name: first_name ?? null,
    last_name: last_name ?? null
  });

  const account_code = makeStampedCode('acc', user.id);
  user.account_code = account_code;
  await user.save();

  const [roles, permissions] = await Promise.all([
    getUserRoleCodes(user.id),
    getUserPermissionCodes(user.id)
  ]);

  const accessToken = issueAccessToken({ sub: user.id, email: user.email, roles, permissions });
  const { token: refreshToken, expAt } = await issueRefreshToken(user.id);

  log.info({ userId: user.id, email: user.email }, 'auth.register.success');
  return res.status(201).json({
    user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, account_code },
    accessToken,
    refreshToken,
    refreshExpAt: expAt.toISOString()
  });
}

/** Connexion */
export async function login(req: Request, res: Response) {
  const log = withReq(req);
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ where: { email } });
  if (!user) {
    log.warn({ email }, 'auth.login.failure.unknown_email');
    await auditAuthLoginFailedUnknownEmail(email, req);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (user.is_active === false) {
    log.warn({ userId: user.id, email }, 'auth.login.failure.disabled_user');
    return res.status(403).json({ message: 'User disabled' });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    log.warn({ userId: user.id, email }, 'auth.login.failure.bad_password');
    await auditAuthLoginFailedBadPassword(user.id, email, req);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.last_login_at = new Date();
  await user.save();

  const [roles, permissions] = await Promise.all([
    getUserRoleCodes(user.id),
    getUserPermissionCodes(user.id)
  ]);

  const accessToken = issueAccessToken({ sub: user.id, email: user.email, roles, permissions });
  const { token: refreshToken, expAt } = await issueRefreshToken(user.id);

  log.info({ userId: user.id, email }, 'auth.login.success');
  await auditAuthLoginSucceeded(user.id, email, req);

  return res.json({ accessToken, refreshToken, refreshExpAt: expAt.toISOString() });
}

/** Déconnexion: révoque un refresh token */
export async function logout(req: Request, res: Response) {
  const log = withReq(req);
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });

  await revokeRefreshToken(refreshToken);
  log.info('auth.logout.success');
  return res.status(204).send();
}

/** Mot de passe perdu */
export async function forgotPassword(req: Request, res: Response) {
  const log = withReq(req);
  const { email } = req.body as { email: string };
  const { issued, token, expAt, user } = await createPasswordReset(email);

  // Audit: on trace la demande (sans révéler au client si email existe ou non)
  await auditAuthPasswordResetRequested(email, !!issued, req);
  log.info({ email, issued }, 'auth.password.reset.requested');

  const response: any = { message: 'If the email exists, a reset link has been sent.' };
  if (issued && token && expAt && user) {
    const resetUrl = buildResetUrl(token);
    const ttlMin = Number(optionalEnv('PASSWORD_RESET_TTL_MIN', '60')) || 60;
    const subject = 'Réinitialisation de votre mot de passe';
    const html = renderPasswordResetHtml({ resetUrl, minutes: ttlMin });
    const text = renderPasswordResetText({ resetUrl, minutes: ttlMin });

    try { await sendMail({ to: user.email, subject, html, text }); }
    catch (e) { log.error({ err: e }, 'auth.password.reset.mail_error'); }

    if (process.env.NODE_ENV !== 'production') {
      response.debug = { token, expAt: expAt.toISOString(), resetUrl };
    }
  }
  return res.json(response);
}

/** Reset mot de passe via token */
export async function resetPassword(req: Request, res: Response) {
  const log = withReq(req);
  const { token, password } = req.body as { token: string; password: string };

  const user = await consumePasswordResetToken(token);
  if (!user) {
    log.warn('auth.password.reset.invalid_token');
    await auditAuthPasswordResetInvalidToken(req);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  user.password_hash = await hashPassword(password);
  await user.save();
  await revokeAllUserRefreshTokens(user.id);

  log.info({ userId: user.id }, 'auth.password.reset.completed');
  await auditAuthPasswordResetCompleted(user.id, req);

  return res.json({ message: 'Password updated' });
}

/** Refresh: rotation du refresh token */
export async function refresh(req: Request, res: Response) {
  const log = withReq(req);

  // ✅ ne plante pas si req.body est undefined
  const body = (req.body ?? {}) as { refreshToken?: string };
  // ✅ accepte aussi en cookie si tu utilises httpOnly cookies côté front
  const refreshToken = body.refreshToken ?? (req as any).cookies?.refreshToken;

  if (!refreshToken) {
    log.warn('auth.refresh.missing_body_or_cookie');
    return res.status(400).json({ message: 'Missing refreshToken' });
  }

  try {
    const exchanged = await exchangeRefreshToken(refreshToken);
    if (!exchanged) {
      log.warn('auth.refresh.failure.invalid');
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const { userId, token: newRefresh, expAt } = exchanged;

    const [roles, permissions, user] = await Promise.all([
      getUserRoleCodes(userId),
      getUserPermissionCodes(userId),
      User.findByPk(userId, { attributes: ['email'] })
    ]);

    const accessToken = issueAccessToken({
      sub: userId,
      email: user?.email || '',
      roles,
      permissions
    });

    log.info({ userId }, 'auth.refresh.success');

    // Option: renvoyer le refresh en cookie httpOnly sécurisé si tu veux
    // res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: true, sameSite: 'strict', expires: expAt });

    return res.json({
      accessToken,
      refreshToken: newRefresh,
      refreshExpAt: expAt.toISOString()
    });
  } catch (e: any) {
    log.error({ err: e }, 'auth.refresh.unexpected_error');
    return res.status(500).json({ message: 'Refresh failed' });
  }
} 
