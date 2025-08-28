/**
 * @file src/validation/rate-plans.schema.ts
 * @description Schemas Joi pour Rate Plans, prix, restrictions.
 */
import Joi from 'joi';



export const ratePlanCreateSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().max(150).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  occupancy_pricing: Joi.boolean().default(true),
  refundable: Joi.boolean().default(true),
  policy: Joi.string().allow(null, '').optional(),
  room_type_id: Joi.number().integer().positive().allow(null).optional()
});

export const ratePlanUpdateSchema = Joi.object({
  code: Joi.string().max(50),
  name: Joi.string().max(150),
  currency: Joi.string().length(3).uppercase(),
  occupancy_pricing: Joi.boolean(),
  refundable: Joi.boolean(),
  policy: Joi.string().allow(null, ''),
  room_type_id: Joi.number().integer().positive().allow(null)
}).min(1);

export const priceUpsertSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  price_base: Joi.number().precision(2).min(0).required(),
  price_extra_adult: Joi.number().precision(2).min(0).default(0),
  price_extra_child: Joi.number().precision(2).min(0).default(0),
  closed: Joi.boolean().default(false)
});

export const restrictionSetSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  min_stay: Joi.number().integer().min(1).allow(null),
  max_stay: Joi.number().integer().min(1).allow(null),
  cta: Joi.boolean().allow(null),
  ctd: Joi.boolean().allow(null),
  advance_min: Joi.number().integer().min(0).allow(null),
  advance_max: Joi.number().integer().min(0).allow(null)
});

export const ratePlanListQuery = Joi.object({
  q: Joi.string().optional(),
  room_type_id: Joi.number().integer().positive().optional(), // ← nouveau
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0)
});
