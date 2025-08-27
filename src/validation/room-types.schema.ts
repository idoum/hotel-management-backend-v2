/**
 * @file src/validation/room-types.schema.ts
 * @description Schemas Joi pour RoomType (create/update, query).
 */
import Joi from 'joi';

export const roomTypeCreateSchema = Joi.object({
  code: Joi.string().max(50).optional(), // auto si non fourni ?
  name: Joi.string().max(150).required(),
  description: Joi.string().allow(null, '').optional(),
  features: Joi.object().unknown(true).allow(null).optional()
});

export const roomTypeUpdateSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().max(150).optional(),
  description: Joi.string().allow(null, '').optional(),
  features: Joi.object().unknown(true).allow(null).optional()
}).min(1);

export const roomTypeListQuery = Joi.object({
  q: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0)
});
