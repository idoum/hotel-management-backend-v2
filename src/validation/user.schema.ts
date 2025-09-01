/**
 * @file src/validation/user.schema.ts
 * @description Joi schemas for user validation (optional, minimal).
 */
import Joi from "joi";

export const createUserSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(190).required(),
  first_name: Joi.string().allow(null, "").max(190),
  last_name: Joi.string().allow(null, "").max(190),
  is_active: Joi.boolean().optional(),
  password: Joi.string().min(6).max(200).optional()
});

export const updateUserSchema = Joi.object({
  first_name: Joi.string().allow(null, "").max(190).optional(),
  last_name: Joi.string().allow(null, "").max(190).optional(),
  is_active: Joi.boolean().optional()
});

export const putUserRolesSchema = Joi.object({
  roleIds: Joi.array().items(Joi.number().integer().positive()).required()
});
