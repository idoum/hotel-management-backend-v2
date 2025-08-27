/**
 * @file src/routes/docs.routes.ts
 * @description Expose l'UI Swagger et le JSON OpenAPI.
 */
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from '@/docs/openapi';

const r = Router();

/**
 * JSON brut du spec — utile pour Postman/clients
 * GET /api/docs/openapi.json
 */
r.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

/**
 * UI Swagger — GET /api/docs
 */
r.use('/', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  explorer: true,
  customSiteTitle: 'Hotel Management API Docs'
}));

export default r;
