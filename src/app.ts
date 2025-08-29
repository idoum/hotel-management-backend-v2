/**
 * @file src/app.ts
 * @description Instancie et configure l'application Express :
 *  - Helmet + CORS (whitelist)
 *  - JSON parser
 *  - routes "/" et "/api/*"
 *  - 404 handler + error handler
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import { helmetMiddleware, corsMiddleware } from '@/middleware/security';
import { httpLogger } from '@/middleware/httpLogger'
import rootRoutes from '@/routes/root.routes';
import apiRouter from '@/loaders/routes';

import { notFound } from '@/middleware/notFound';
import { errorHandler } from '@/middleware/errorHandler';
import pinoHttp from 'pino-http';
import logger from '@/utils/logger';
import crypto from 'crypto';

const app = express();

/**
 * Configure et retourne l'instance Express.
 */
function configureApp() {
  // Sécurité HTTP
  app.use(helmetMiddleware());
  app.use(corsMiddleware());

  // Logs HTTP structurés
  app.use(httpLogger);
  app.use(pinoHttp({
    logger,
    genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
  }));
  
  // Parser JSON
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());


  // Routes
  app.use('/', rootRoutes);
  app.use('/api', apiRouter);

  // 404 & erreurs
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

configureApp();
export default app;
