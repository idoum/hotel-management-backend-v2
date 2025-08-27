/**
 * @file src/validation/auth.schema.ts
 * @description Schémas Joi pour register, login, forgot/reset, logout, refresh.
 */
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().max(190).required(),
  password: Joi.string().min(8).max(128).required(),
  first_name: Joi.string().allow('', null),
  last_name: Joi.string().allow('', null)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(190).required(),
  password: Joi.string().required()
});

export const forgotSchema = Joi.object({
  email: Joi.string().email().max(190).required()
});

export const resetSchema = Joi.object({
  token: Joi.string().min(32).max(512).required(),
  password: Joi.string().min(8).max(128).required()
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().min(16).max(2048).required()
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().min(16).max(2048).required()
});
