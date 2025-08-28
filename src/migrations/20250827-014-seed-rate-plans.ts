/**
 * @file src/migrations/20250827-014-seed-rate-plans.ts
 * @description Seed: plan BAR + prix 10 jours + quelques restrictions, sans date-fns.
 */
import { QueryInterface } from 'sequelize';

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(0,0,0,0); return x; }
function formatDateOnly(d: Date): string {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export async function up(q: QueryInterface) {
  const now = new Date();

  // 1) Insère BAR s'il n'existe pas
  const [rows]: any = await q.sequelize.query('SELECT id FROM rate_plans WHERE code=? LIMIT 1', { replacements: ['BAR'] });
  let ratePlanId = rows?.[0]?.id ?? null;

  if (!ratePlanId) {
    await q.bulkInsert('rate_plans', [{
      code: 'BAR', name: 'Best Available Rate', currency: 'USD',
      occupancy_pricing: 1, refundable: 1, policy: 'Flexible 24h', room_type_id: null,
      created_at: now, updated_at: now
    }]);
    const [rp]: any = await q.sequelize.query('SELECT id FROM rate_plans WHERE code=? LIMIT 1', { replacements: ['BAR'] });
    ratePlanId = rp[0].id;
  }

  // 2) Prix pour 10 jours
  const prices: any[] = [];
  const baseDay = startOfDay(now);
  for (let i = 0; i < 10; i++) {
    const d = addDays(baseDay, i);
    prices.push({
      rate_plan_id: ratePlanId,
      date: formatDateOnly(d),
      price_base: 120 + i * 2,
      price_extra_adult: 20,
      price_extra_child: 10,
      closed: 0,
      created_at: now, updated_at: now
    });
  }
  await q.bulkInsert('rate_plan_prices', prices, { ignoreDuplicates: true } as any);

  // 3) Restrictions
  const d1 = formatDateOnly(addDays(baseDay, 3));
  const d2 = formatDateOnly(addDays(baseDay, 5));

  await q.bulkInsert('rate_restrictions', [
    { rate_plan_id: ratePlanId, date: d1, min_stay: 2, max_stay: null, cta: null, ctd: null, advance_min: null, advance_max: null, created_at: now, updated_at: now },
    { rate_plan_id: ratePlanId, date: d2, min_stay: null, max_stay: null, cta: 1, ctd: null, advance_min: null, advance_max: null, created_at: now, updated_at: now }
  ], { ignoreDuplicates: true } as any);
}

export async function down(q: QueryInterface) {
  await q.bulkDelete('rate_restrictions', {}, {} as any);
  await q.bulkDelete('rate_plan_prices', {}, {} as any);
  await q.bulkDelete('rate_plans', { code: 'BAR' } as any, {} as any);
}
