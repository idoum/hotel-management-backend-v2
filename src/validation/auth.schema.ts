/**
 * @file src/validation/auth.schema.ts
 * @description Schémas Joi pour les endpoints d'authentification.
 */

import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().max(191).required(),
  password: Joi.string().min(6).max(100).required()
});
