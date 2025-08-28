/**
 * @file src/validation/reservations.schema.ts
 * @description Schémas pour création/mise à jour de réservation.
 */
import Joi from 'joi';

export const reservationCreateSchema = Joi.object({
  guest_name: Joi.string().allow('', null),
  guest_email: Joi.string().email().allow('', null),
  guest_phone: Joi.string().allow('', null),
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  source: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  rooms: Joi.array().items(
    Joi.object({
      room_type_id: Joi.number().integer().positive().required(),
      rate_plan_id: Joi.number().integer().positive().allow(null),
      adults: Joi.number().integer().min(1).default(2),
      children: Joi.number().integer().min(0).default(0),
      qty: Joi.number().integer().min(1).default(1)
    })
  ).min(1).required()
}).custom((v, helpers) => {
  const ci = new Date(v.check_in);
  const co = new Date(v.check_out);
  if (!(ci < co)) return helpers.error('any.invalid', { message: 'check_out must be after check_in' });
  return v;
}, 'date order');

export const reservationUpdateSchema = Joi.object({
  status: Joi.string().valid('pending','confirmed','cancelled','checked_in','checked_out'),
  notes: Joi.string().allow('', null),
  // assignation de chambre pour une ligne précise
  assign: Joi.object({
    line_id: Joi.number().integer().positive().required(),
    room_id: Joi.number().integer().positive().allow(null).required()
  }).optional()
}).min(1);

export const reservationsListQuery = Joi.object({
  q: Joi.string().allow(''),
  status: Joi.string().valid('pending','confirmed','cancelled','checked_in','checked_out'),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort: Joi.string().example('check_in:ASC,code:DESC')
});
