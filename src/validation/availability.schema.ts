/**
 * @file src/validation/availability.schema.ts
 * @description Schémas pour la recherche de disponibilité.
 */
import Joi from 'joi';

export const availabilityQuerySchema = Joi.object({
  room_type_id: Joi.number().integer().positive().required(),
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().required(),
  rooms: Joi.number().integer().min(1).default(1)
}).custom((v, helpers) => {
  const ci = new Date(v.check_in);
  const co = new Date(v.check_out);
  if (!(ci < co)) return helpers.error('any.invalid', { message: 'check_out must be after check_in' });
  return v;
}, 'date order');
