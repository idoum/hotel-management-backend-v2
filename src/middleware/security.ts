/**
 * @file src/middleware/security.ts
 * @description Sécurité HTTP: Helmet + CORS avec whitelist par env.
 */
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';

/**
 * Construit un middleware Helmet standard pour API.
 * @returns Helmet middleware
 */
export function helmetMiddleware() {
  // Helmet par défaut (XSS, MIME sniffing, noSniff, frameguard, etc.)
  return helmet();
}

/**
 * Construit un middleware CORS selon ALLOWED_ORIGINS (liste séparée par des virgules).
 * - Si ALLOWED_ORIGINS non défini -> autorise tout (dev)
 * - Sinon, autorise seulement les origins de la whitelist
 */
export function corsMiddleware() {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const hasWhitelist = allowed.length > 0;

  const options: CorsOptions | boolean = hasWhitelist
    ? {
        origin(origin, cb) {
          // Autorise les requêtes "same-origin" (ex: curl / Postman -> origin null)
          if (!origin) return cb(null, true);
          if (allowed.includes(origin)) return cb(null, true);
          return cb(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET','HEAD','POST','PUT','PATCH','DELETE'],
        allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
      }
    : true;

  return cors(options as any);
}
