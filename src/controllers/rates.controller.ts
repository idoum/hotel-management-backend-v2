/**
 * @file src/controllers/rates.controller.ts
 * @description /rates/quote — délègue au service de tarification.
 */
import { Request, Response } from 'express';
import { quoteRatePlan } from '@/services/rates.service';

export async function quoteRates(req: Request, res: Response) {
  try {
    const params: any = {
      plan_code: (req.query.plan_code as string) ?? 'BAR',
      check_in: String(req.query.check_in),
      check_out: String(req.query.check_out),
      adults: req.query.adults ? Number(req.query.adults) : 2,
      children: req.query.children ? Number(req.query.children) : 0
    };
    if (req.query.rate_plan_id !== undefined) {
      params.rate_plan_id = Number(req.query.rate_plan_id);
    }
    if (req.query.room_type_id !== undefined) {
      params.room_type_id = Number(req.query.room_type_id);
    }
    const result = await quoteRatePlan(params);
    res.json(result);
  } catch (e: any) {
    res.status(422).json({ message: e.message || 'Quote error' });
  }
}
