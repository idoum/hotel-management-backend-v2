/**
 * @file src/middleware/rateLimit.ts
 * @description Rate limiting pour les endpoints sensibles (login/register/forgot).
 */
import rateLimit from 'express-rate-limit';

/**
 * Crée un rate limiter paramétrable.
 * @param windowMs fenêtre en ms
 * @param max requêtes max par IP dans la fenêtre
 * @param message message en cas de dépassement
 */
function makeLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
  });
}

// Valeurs par défaut raisonnables (surchageables par env si tu veux)
const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_LOGIN = Number(process.env.RATE_LIMIT_MAX_LOGIN || 10);
const MAX_REGISTER = Number(process.env.RATE_LIMIT_MAX_REGISTER || 10);
const MAX_FORGOT = Number(process.env.RATE_LIMIT_MAX_FORGOT || 5);

/** Limiteur pour /auth/login */
export const loginLimiter = makeLimiter(WINDOW, MAX_LOGIN, 'Too many login attempts. Try again later.');

/** Limiteur pour /auth/register */
export const registerLimiter = makeLimiter(WINDOW, MAX_REGISTER, 'Too many registrations from this IP.');

/** Limiteur pour /auth/forgot-password */
export const forgotLimiter = makeLimiter(WINDOW, MAX_FORGOT, 'Too many reset requests. Try again later.');
