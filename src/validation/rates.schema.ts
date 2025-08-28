/**
 * @file src/validation/rates.schema.ts
 * @description Schéma Joi pour quotation /rates/quote
 */
import Joi from 'joi';

export const quoteQuerySchema = Joi.object({
  rate_plan_id: Joi.number().integer().positive().optional(),
  room_type_id: Joi.number().integer().positive().optional(), // ← nouveau (sélection auto)
  plan_code: Joi.string().max(50).default('BAR').optional(),  // ← code préféré
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().required(),
  adults: Joi.number().integer().min(1).default(2),
  children: Joi.number().integer().min(0).default(0)
})
  .custom((v, helpers) => {
    if (!v.rate_plan_id && !v.room_type_id) {
      return helpers.error('any.invalid', { message: 'rate_plan_id OR room_type_id is required' });
    }
    const ci = new Date(v.check_in);
    const co = new Date(v.check_out);
    if (!(ci < co)) return helpers.error('any.invalid', { message: 'check_out must be after check_in' });
    return v;
  }, 'cross fields');
