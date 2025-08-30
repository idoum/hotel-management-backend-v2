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
  email: Joi.string().email({ tlds: { allow: false } }).max(190).required(),
  password: Joi.string().required()
});

export const forgotSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(190).required()
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

/**
 * @constant changePasswordSchema
 * @description Validation pour le changement de mot de passe.
 * - currentPassword: requis
 * - newPassword: min 8, 1 minuscule, 1 majuscule, 1 chiffre, 1 spécial
 * - confirmNewPassword: doit matcher newPassword
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    // .min(8)
    // .pattern(/[a-z]/, 'lowercase')
    // .pattern(/[A-Z]/, 'uppercase')
    // .pattern(/[0-9]/, 'digit')
    // .pattern(/[^a-zA-Z0-9]/, 'special')
    .required(),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'confirmNewPassword must match newPassword' })
});
