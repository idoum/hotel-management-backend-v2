/**
 * @file src/validation/role.schema.ts
 * @description Schémas Joi pour rôles.
 */
import Joi from 'joi';

export const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(128).required(),
  code: Joi.string().min(2).max(64).optional() // si non fourni, généré
});

export const assignRoleSchema = Joi.object({
  role_id: Joi.number().integer().positive().required()
});
