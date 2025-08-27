/**
 * @file src/validation/rooms.schema.ts
 * @description Schemas Joi pour Room (create/update) + liste avec filtres avancés.
 */
import Joi from 'joi';

export const roomsListQuery = Joi.object({
  q: Joi.string().optional(),

  // Multi-status: "vacant,ooo" ou status[]=vacant&status[]=ooo
  status: Joi.alternatives(
    Joi.string().valid('vacant', 'occupied', 'ooo', 'oos'),
    Joi.array().items(Joi.string().valid('vacant', 'occupied', 'ooo', 'oos'))
  ).optional(),

  // room_type_id simple ou multiple (ex: "1,2" ou room_type_id[]=1&room_type_id[]=2)
  room_type_id: Joi.alternatives(
    Joi.number().integer().positive(),
    Joi.array().items(Joi.number().integer().positive())
  ).optional(),

  // Etages: liste OU plage min/max
  floors: Joi.alternatives(
    Joi.string(), // "1,2,3"
    Joi.array().items(Joi.number().integer())
  ).optional(),
  floorMin: Joi.number().integer().optional(),
  floorMax: Joi.number().integer().optional(),

  // Pagination
  limit: Joi.number().integer().min(1).max(200).default(50),
  offset: Joi.number().integer().min(0).default(0),

  // Tri multi-colonnes: "number:ASC,floor:DESC,status:ASC"
  sort: Joi.string().optional()
});

export const roomCreateSchema = Joi.object({
  number: Joi.string().max(20).required(),
  floor: Joi.number().integer().allow(null).optional(),
  room_type_id: Joi.number().integer().positive().required(),
  status: Joi.string().valid('vacant','occupied','ooo','oos').optional(),
  out_of_service_reason: Joi.string().max(255).allow(null, '').optional(),
  oos_since: Joi.date().allow(null).optional(),
  features: Joi.object().unknown(true).allow(null).optional()
});

export const roomUpdateSchema = Joi.object({
  number: Joi.string().max(20).optional(),
  floor: Joi.number().integer().allow(null).optional(),
  room_type_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('vacant','occupied','ooo','oos').optional(),
  out_of_service_reason: Joi.string().max(255).allow(null, '').optional(),
  oos_since: Joi.date().allow(null).optional(),
  features: Joi.object().unknown(true).allow(null).optional()
}).min(1);
