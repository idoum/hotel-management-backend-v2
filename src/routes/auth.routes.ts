/**
 * @file src/routes/auth.routes.ts
 * @description Routes d'authentification : register, login, logout, forgot/reset, refresh.
 */
import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { register, login, logout, forgotPassword, resetPassword, refresh } from '@/controllers/auth.controller';
import { registerSchema, loginSchema, logoutSchema, forgotSchema, resetSchema, refreshSchema } from '@/validation/auth.schema';
import { loginLimiter, registerLimiter, forgotLimiter } from '@/middleware/rateLimit';
import { changePassword } from '@/controllers/auth.controller';
import { changePasswordSchema } from '@/validation/auth.schema';
import { requireAuth } from '@/middleware/auth';

const r = Router();

// Register (limité)
r.post('/register', registerLimiter, validate(registerSchema), register);

// Login (limité)
r.post('/login', loginLimiter, validate(loginSchema), login);

// Logout (révoque un refresh)
r.post('/logout', validate(logoutSchema), logout);

// Forgot-password (limité)
r.post('/forgot-password', forgotLimiter, validate(forgotSchema), forgotPassword);

// Reset-password
r.post('/reset-password', validate(resetSchema), resetPassword);

// Refresh (rotation + nouveau access)
r.post('/refresh', validate(refreshSchema), refresh);

r.post('/change-password', requireAuth,  changePassword);


export default r;
