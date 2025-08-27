/**
 * @file src/validation/permission.schema.ts
 * @description Schémas Joi pour permissions.
 */
import Joi from 'joi';

export const createPermissionSchema = Joi.object({
  name: Joi.string().min(2).max(128).required(),
  code: Joi.string().min(2).max(64).optional(), // si non fourni, généré
  resource: Joi.string().min(2).max(64).optional(), // aide à générer le code
  action: Joi.string().valid('view','create','update','delete','export').optional()
});

export const attachPermissionSchema = Joi.object({
  permission_id: Joi.number().integer().positive().required()
});
