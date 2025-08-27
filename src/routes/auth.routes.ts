/**
 * @file src/routes/auth.routes.ts
 * @description Routes d'authentification (login).
 */

import { Router } from 'express';
import { login } from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate';
import { loginSchema } from '@/validation/auth.schema';

const r = Router();
r.post('/login', validate(loginSchema), login);

export default r;
