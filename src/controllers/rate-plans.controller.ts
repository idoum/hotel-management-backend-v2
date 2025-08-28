/**
 * @file src/controllers/rate-plans.controller.ts
 * @description CRUD Rate Plans + upsert prix + set restrictions.
 */
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { addDays, eachDayOfInterval, formatISO, startOfDay } from 'date-fns';
import RatePlan from '@/models/RatePlan';
import RatePlanPrice from '@/models/RatePlanPrice';
import RateRestriction from '@/models/RateRestriction';
import { ratePlanCreateSchema, ratePlanUpdateSchema, priceUpsertSchema, restrictionSetSchema, ratePlanListQuery } from '@/validation/rate-plans.schema';

export async function listRatePlans(req: Request, res: Response) {
  const { value, error } = ratePlanListQuery.validate(req.query);
  if (error) return res.status(422).json({ message: error.message });

  const where: any = {};
  if (value.q) where[Op.or] = [{ code: { [Op.like]: `%${value.q}%` } }, { name: { [Op.like]: `%${value.q}%` } }];
  if (value.room_type_id) where.room_type_id = value.room_type_id; // ← filtre RT

  const rows = await RatePlan.findAll({
    where,
    order: [['room_type_id', 'DESC'], ['name', 'ASC']], // plans liés au RT d’abord
    limit: value.limit,
    offset: value.offset
  });
  res.json(rows);
}


export async function createRatePlan(req: Request, res: Response) {
  const { value, error } = ratePlanCreateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const code = value.code ?? value.name.trim().toUpperCase().slice(0, 10);
  const row = await RatePlan.create({ ...value, code });
  res.status(201).json(row);
}

export async function updateRatePlan(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { value, error } = ratePlanUpdateSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const rp = await RatePlan.findByPk(id);
  if (!rp) return res.status(404).json({ message: 'Rate plan not found' });

  Object.assign(rp, value);
  await rp.save();
  res.json(rp);
}

export async function deleteRatePlan(req: Request, res: Response) {
  const id = Number(req.params.id);
  const rp = await RatePlan.findByPk(id);
  if (!rp) return res.status(404).json({ message: 'Rate plan not found' });

  await rp.destroy();
  res.status(204).send();
}

/**
 * @description PUT /rate-plans/:id/prices — Upsert prix sur une plage de dates.
 */
export async function upsertPrices(req: Request, res: Response) {
  const rate_plan_id = Number(req.params.id);
  const { value, error } = priceUpsertSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const rp = await RatePlan.findByPk(rate_plan_id);
  if (!rp) return res.status(404).json({ message: 'Rate plan not found' });

  const days = eachDayOfInterval({ start: startOfDay(new Date(value.start_date)), end: startOfDay(new Date(value.end_date)) });
  const now = new Date();
  const rows = days.map((d) => ({
    rate_plan_id,
    date: formatISO(d, { representation: 'date' }),
    price_base: value.price_base,
    price_extra_adult: value.price_extra_adult,
    price_extra_child: value.price_extra_child,
    closed: value.closed,
    created_at: now,
    updated_at: now
  }));

  await RatePlanPrice.bulkCreate(rows, { updateOnDuplicate: ['price_base', 'price_extra_adult', 'price_extra_child', 'closed', 'updated_at'] });
  res.status(204).send();
}

/**
 * @description PUT /rate-plans/:id/restrictions — Set restrictions sur plage de dates.
 */
export async function setRestrictions(req: Request, res: Response) {
  const rate_plan_id = Number(req.params.id);
  const { value, error } = restrictionSetSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.message });

  const rp = await RatePlan.findByPk(rate_plan_id);
  if (!rp) return res.status(404).json({ message: 'Rate plan not found' });

  const days = eachDayOfInterval({ start: startOfDay(new Date(value.start_date)), end: startOfDay(new Date(value.end_date)) });
  const now = new Date();
  const rows = days.map((d) => ({
    rate_plan_id,
    date: formatISO(d, { representation: 'date' }),
    min_stay: value.min_stay ?? null,
    max_stay: value.max_stay ?? null,
    cta: value.cta ?? null,
    ctd: value.ctd ?? null,
    advance_min: value.advance_min ?? null,
    advance_max: value.advance_max ?? null,
    created_at: now,
    updated_at: now
  }));

  await RateRestriction.bulkCreate(rows, {
    updateOnDuplicate: ['min_stay', 'max_stay', 'cta', 'ctd', 'advance_min', 'advance_max', 'updated_at']
  });

  res.status(204).send();
}
